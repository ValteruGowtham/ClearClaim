# ⚙️ ClearClaim — Technical Architecture & Engineering Deep Dive

---

## Overview

ClearClaim is a multi-agent healthcare automation platform powered by the **TinyFish Web Agent API**. It orchestrates autonomous browser agents to interact with real insurance payer portals — executing prior authorization workflows, eligibility checks, claim tracking, and denial appeals without human intervention.

This document covers the full technical stack, agent architecture, data flow, infrastructure decisions, and implementation strategy.

---

## Core Technology: Why TinyFish

Insurance payer portals are among the hardest targets for automation:

- Session-based authentication with MFA and CAPTCHA
- Dynamically rendered forms (React/Angular SPAs)
- Conditional field logic (diagnosis-code-driven form branching)
- Pagination-heavy claim lists
- Pop-up modals for document uploads
- Session timeouts requiring re-authentication mid-task

Traditional RPA tools (UiPath, Selenium) fail here due to brittleness against DOM changes. Static API integrations don't exist for most payers. **TinyFish's agentic browser infrastructure** is purpose-built for this exact problem — persistent browser sessions, natural language task execution, and dynamic UI adaptation.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ClearClaim Platform                       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Next.js 14  │    │  FastAPI     │    │  Task Orchestrat │  │
│  │  Dashboard   │◄──►│  Backend     │◄──►│  or (Celery +    │  │
│  │  (v0/Vercel) │    │  (Python)    │    │  Redis Queue)    │  │
│  └──────────────┘    └──────┬───────┘    └────────┬─────────┘  │
│                             │                     │             │
│                    ┌────────▼──────────────────────▼──────────┐ │
│                    │         Agent Manager Layer               │ │
│                    │  - Task routing & prioritization          │ │
│                    │  - Payer portal registry                  │ │
│                    │  - Session lifecycle management           │ │
│                    │  - Retry & fallback logic                 │ │
│                    └────────────────┬──────────────────────────┘ │
│                                     │                            │
│                    ┌────────────────▼──────────────────────────┐ │
│                    │       TinyFish Web Agent API              │ │
│                    │  - Persistent browser sessions            │ │
│                    │  - Natural language task execution        │ │
│                    │  - Screenshot & DOM state capture         │ │
│                    │  - Form fill & multi-step navigation      │ │
│                    └────────────────┬──────────────────────────┘ │
│                                     │                            │
│       ┌─────────────────────────────▼────────────────────────┐  │
│       │              Live Payer Portals (Web)                 │  │
│       │  Availity │ NaviNet │ UHC │ BCBS │ Aetna │ Cigna...  │  │
│       └──────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  MongoDB     │    │  AgentOps    │    │  AgentMail       │  │
│  │  (Data Store)│    │  (Monitoring)│    │  (Notifications) │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Workflow: Prior Authorization (Deep Dive)

This is the most complex workflow — it illustrates the full agent capability.

### Step 1: Task Ingestion
```json
{
  "task_type": "prior_auth",
  "patient": {
    "name": "Jane Smith",
    "dob": "1985-04-12",
    "member_id": "UHC8827712",
    "insurance": "UnitedHealthcare"
  },
  "provider": {
    "npi": "1234567890",
    "practice_id": "PRAC-001"
  },
  "procedure": {
    "cpt_code": "72148",
    "description": "MRI Lumbar Spine without contrast",
    "icd10": "M54.5",
    "clinical_notes_url": "s3://clearclaim-docs/notes/smith-123.pdf"
  }
}
```

### Step 2: Payer Portal Routing
The Agent Manager consults the **Payer Registry** — a maintained database of portal URLs, login flows, known UI patterns, and task-specific navigation paths for 200+ insurance companies.

```python
payer_config = PayerRegistry.get("UnitedHealthcare")
# Returns: {
#   portal_url: "https://provider.uhc.com",
#   login_flow: "username_password_mfa",
#   prior_auth_path: "/auth/prior-auth/new",
#   known_selectors: {...},
#   session_timeout_minutes: 20
# }
```

### Step 3: TinyFish Agent Execution
```python
agent = TinyFishClient(api_key=TINYFISH_KEY)

session = agent.create_session(
    browser="chromium",
    persistent=True,
    timeout_minutes=30
)

result = agent.execute_task(
    session_id=session.id,
    task="""
    Navigate to UnitedHealthcare provider portal at https://provider.uhc.com.
    Log in using credentials for NPI {npi}.
    Submit a prior authorization request for:
    - Patient: {patient_name}, DOB {dob}, Member ID {member_id}
    - Procedure: CPT {cpt_code} - {procedure_description}
    - Diagnosis: ICD-10 {icd10}
    - Upload clinical notes from {document_url}
    Return the authorization tracking number and confirmation.
    If MFA is required, use the authenticator code from the secure vault.
    If a pop-up appears requesting additional clinical information, fill it using the provided notes.
    """,
    variables={...},
    on_screenshot=capture_audit_screenshot,
    on_state_change=log_agent_state
)
```

### Step 4: State Management & Error Handling
```python
class AgentTaskManager:
    
    MAX_RETRIES = 3
    
    async def execute_with_retry(self, task: AgentTask):
        for attempt in range(self.MAX_RETRIES):
            try:
                result = await self.tinyfish.execute(task)
                if result.status == "success":
                    await self.store_result(result)
                    await self.notify(task, result)
                    return result
                elif result.status == "requires_human":
                    # Agent hit ambiguity it can't resolve
                    await self.escalate_to_human(task, result.screenshot)
                    return
            except SessionTimeoutError:
                await self.reauthenticate(task.payer)
            except UnexpectedUIError as e:
                await self.log_ui_anomaly(e, task.payer)
                # Feed back to Payer Registry for future improvement
                await self.payer_registry.flag_ui_change(task.payer, e)
        
        await self.mark_failed(task)
```

### Step 5: Result Storage & Notification
```python
# MongoDB document
{
  "_id": "task_89a2f1",
  "type": "prior_auth",
  "status": "approved",
  "patient_id": "pt_smith_001",
  "payer": "UnitedHealthcare",
  "auth_number": "PA-UHC-2024-88271",
  "valid_from": "2024-01-15",
  "valid_until": "2024-07-15",
  "approved_units": 1,
  "screenshots": ["s3://audit/task_89a2f1/step_1.png", ...],
  "agent_trace": [...],
  "created_at": "2024-01-14T09:31:00Z",
  "completed_at": "2024-01-14T09:34:22Z",
  "duration_seconds": 202
}
```

AgentMail sends a notification email to the provider:
> *"✅ Prior Auth Approved — Jane Smith MRI Lumbar Spine. Auth #PA-UHC-2024-88271. Valid Jan 15 – Jul 15, 2024."*

---

## Full Tech Stack

### Frontend
| Component | Technology | Rationale |
|---|---|---|
| Dashboard UI | Next.js 14 + TypeScript | SSR performance, v0 by Vercel for rapid UI generation |
| Styling | Tailwind CSS + shadcn/ui | Fast, accessible component library |
| Charts & Analytics | Recharts | Auth approval rates, denial trends, time saved |
| Real-time updates | WebSockets (Socket.io) | Live agent status feed |

### Backend
| Component | Technology | Rationale |
|---|---|---|
| API Server | FastAPI (Python) | Async-first, auto-generated OpenAPI docs |
| Task Queue | Celery + Redis | Distributed agent task scheduling |
| Agent Orchestration | Custom Python layer | TinyFish session lifecycle management |
| Auth | Auth0 + JWT | HIPAA-compliant identity management |
| Document Storage | AWS S3 (encrypted) | Clinical notes, audit screenshots |

### Data Layer
| Component | Technology | Rationale |
|---|---|---|
| Primary Database | MongoDB Atlas | Flexible schema for varied payer response formats |
| Credential Vault | AWS Secrets Manager | Encrypted storage of payer portal credentials |
| Search | MongoDB Atlas Search | Full-text search over patient/claim records |
| Caching | Redis | Session tokens, payer configs |

### AI & Agent Layer
| Component | Technology | Rationale |
|---|---|---|
| Web Agents | TinyFish API | Core agentic browser infrastructure |
| LLM Backbone | Fireworks.ai (LLaMA 3 70B) | Fast inference for agent reasoning |
| Document AI | Claude API (Anthropic) | Clinical notes parsing, denial letter analysis |

### Observability & Ops
| Component | Technology | Rationale |
|---|---|---|
| Agent Monitoring | AgentOps | Full agent trace logging, latency, token usage |
| Application Logs | Axiom | Structured logging, real-time query |
| Infrastructure | Google Cloud (GCP) | Google for Startups credits, HIPAA BAA available |
| CI/CD | GitHub Actions + Vercel | Automated testing + deployment |
| Error Tracking | Sentry | Frontend + backend exception monitoring |

### Notifications
| Component | Technology | Rationale |
|---|---|---|
| Email Notifications | AgentMail | Task completion, denial alerts, weekly summaries |
| Voice Alerts | ElevenLabs | Optional voice briefing for high-priority denials |

---

## HIPAA Compliance Architecture

Healthcare data handling requires strict compliance. ClearClaim is designed HIPAA-ready from day one.

**PHI (Protected Health Information) Handling:**
- All PHI encrypted at rest (AES-256) and in transit (TLS 1.3)
- MongoDB Atlas configured with encryption-at-rest enabled
- AWS S3 buckets with SSE-S3 encryption, no public access
- PHI never logged in plaintext — all logs use patient ID references
- Audit trail maintained for every agent action involving PHI

**Access Control:**
- Role-based access: Admin / Biller / Provider / Read-only
- MFA enforced for all provider accounts
- Session tokens expire after 60 minutes of inactivity

**Infrastructure:**
- Deployed on GCP regions with HIPAA-eligible services
- Business Associate Agreement (BAA) signed with cloud providers
- Annual penetration testing planned post-launch

**Credential Security:**
- Payer portal credentials stored in AWS Secrets Manager
- Credentials never exposed to frontend, never logged
- Rotation policy enforced every 90 days

---

## Payer Portal Compatibility Strategy

The hardest engineering challenge is supporting 200+ payer portals. Our approach:

**Tier 1 (Launch — top 10 payers by volume):**
Availity (multi-payer), UnitedHealthcare, Blue Cross Blue Shield, Aetna, Cigna, Humana, Medicaid (state portals), Medicare (NGS/Noridian)

**Tier 2 (Month 2–3):**
Regional BCBS plans, WellCare, Molina, Centene, Oscar Health

**Payer Registry Architecture:**
```python
class PayerProfile:
    payer_id: str
    display_name: str
    portal_url: str
    login_type: Literal["username_password", "npi_pin", "sso"]
    mfa_type: Optional[Literal["email", "sms", "authenticator"]]
    prior_auth_supported: bool
    eligibility_supported: bool
    claim_status_supported: bool
    appeal_supported: bool
    known_quirks: List[str]  # e.g., "session_timeout_15min", "requires_java_popup"
    last_verified: datetime
    success_rate: float  # tracked via AgentOps
```

---

## Agent Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Prior Auth Submission Time | < 4 minutes | vs. 30–45 min manual |
| Eligibility Check Time | < 90 seconds | vs. 10–15 min manual |
| Task Success Rate | > 92% | Remainder escalated to human |
| Uptime | 99.5% | GCP + multi-region Redis |
| Concurrent Sessions | 50+ | Horizontally scalable via Celery workers |

---

## Scalability Plan

**Phase 1 (MVP, Month 1):** Single-tenant, monolithic FastAPI + Next.js on GCP Cloud Run. Celery workers for async agent tasks.

**Phase 2 (Growth, Month 3+):** Multi-tenant SaaS. Tenant isolation via MongoDB namespacing. Agent worker pool auto-scales based on task queue depth.

**Phase 3 (Scale, Month 6+):** Dedicated agent pools per large enterprise customer. Kafka for event streaming at high volume. Microservices split for agent orchestration.

---

## Repository Structure

```
clearclaim/
├── frontend/               # Next.js 14 dashboard
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/                # FastAPI server
│   ├── api/
│   ├── agents/             # TinyFish integration layer
│   ├── payer_registry/     # Per-payer configs & profiles
│   ├── tasks/              # Celery task definitions
│   └── models/             # MongoDB schemas (Beanie ODM)
├── agent_workflows/        # Natural language task templates per payer
├── infrastructure/         # Terraform (GCP), Docker, CI configs
├── compliance/             # HIPAA policies, BAA templates
└── tests/
    ├── unit/
    ├── integration/
    └── agent_simulation/   # Replay tests against payer sandboxes
```

---

*ClearClaim — Agentic infrastructure for healthcare's hardest admin problems.*
