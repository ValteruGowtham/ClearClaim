"""
AgentMail integration — transactional email notifications via HTTP POST.
"""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MailService:
    """Wraps the AgentMail REST API for sending transactional emails."""

    BASE_URL = "https://api.agentmail.to/v0"

    def __init__(self) -> None:
        self.api_key = settings.AGENTMAIL_API_KEY
        self.from_email = settings.AGENTMAIL_FROM_EMAIL
        self.enabled = bool(self.api_key)
        if not self.enabled:
            logger.warning("AGENTMAIL_API_KEY not set — email notifications disabled")

    # ── Core send ────────────────────────────────────────────────────

    async def send(self, to: str, subject: str, html: str, text: str) -> bool:
        """Send a single email via AgentMail POST /mail/send."""
        if not self.enabled:
            logger.info("[MAIL DISABLED] Would send to %s: %s", to, subject)
            return True

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/mail/send",
                    headers={
                        "X-API-Key": self.api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": self.from_email,
                        "to": [to],
                        "subject": subject,
                        "html": html,
                        "text": text,
                    },
                    timeout=10.0,
                )
            if response.status_code in (200, 201, 202):
                logger.info("Email sent to %s: %s", to, subject)
                return True

            logger.error("AgentMail error %s: %s", response.status_code, response.text)
            return False
        except Exception:
            logger.exception("Failed to send email to %s", to)
            return False

    # ── Notification: task completed ─────────────────────────────────

    async def notify_task_completed(
        self,
        to_email: str,
        patient_name: str,
        task_type: str,
        payer: str,
        result: dict,
        task_id: str,
    ) -> bool:
        """Send when agent completes a task successfully."""

        auth_number = result.get("auth_tracking_number") or result.get("auth_number", "")
        payer_response = result.get("payer_response", "")

        subjects = {
            "prior_auth": f"✅ Prior Auth {'Approved' if auth_number else 'Submitted'} — {patient_name}",
            "eligibility": f"✅ Eligibility Verified — {patient_name}",
            "claim_status": f"✅ Claim Status Updated — {patient_name}",
            "appeal": f"✅ Appeal Submitted — {patient_name}",
        }
        subject = subjects.get(task_type, f"✅ Task Completed — {patient_name}")

        auth_row = ""
        if auth_number:
            auth_row = f"""
            <tr>
              <td style="padding: 12px 0; color: #8892a4;
                          border-bottom: 1px solid #1e2d45;">
                Auth Number
              </td>
              <td style="padding: 12px 0; color: #00d4c8;
                          border-bottom: 1px solid #1e2d45;
                          font-weight: bold; font-family: monospace;">
                {auth_number}
              </td>
            </tr>"""

        html = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0a0f1e;
             color: #f0f4ff; padding: 32px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;
              background: #111827; border-radius: 12px;
              border: 1px solid #1e2d45; overflow: hidden;">

    <!-- Header -->
    <div style="background: #0f1629; padding: 24px 32px;
                border-bottom: 1px solid #1e2d45;">
      <h1 style="margin: 0; color: #00d4c8; font-size: 24px;">ClearClaim</h1>
      <p style="margin: 4px 0 0; color: #8892a4; font-size: 12px;
                letter-spacing: 2px; text-transform: uppercase;">
        Autonomous Insurance Navigation
      </p>
    </div>

    <!-- Status Banner -->
    <div style="background: #00c89620; border-left: 4px solid #00c896;
                padding: 16px 32px; margin: 24px 32px; border-radius: 4px;">
      <p style="margin: 0; color: #00c896; font-weight: bold; font-size: 16px;">
        ✅ Task Completed Successfully
      </p>
    </div>

    <!-- Details -->
    <div style="padding: 0 32px 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #8892a4;
                      border-bottom: 1px solid #1e2d45; width: 40%;">
            Patient
          </td>
          <td style="padding: 12px 0; color: #f0f4ff;
                      border-bottom: 1px solid #1e2d45; font-weight: bold;">
            {patient_name}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #8892a4;
                      border-bottom: 1px solid #1e2d45;">
            Task Type
          </td>
          <td style="padding: 12px 0; color: #f0f4ff;
                      border-bottom: 1px solid #1e2d45;">
            {task_type.replace("_", " ").title()}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #8892a4;
                      border-bottom: 1px solid #1e2d45;">
            Payer
          </td>
          <td style="padding: 12px 0; color: #f0f4ff;
                      border-bottom: 1px solid #1e2d45;">
            {payer}
          </td>
        </tr>
        {auth_row}
        <tr>
          <td style="padding: 12px 0; color: #8892a4;">
            Payer Response
          </td>
          <td style="padding: 12px 0; color: #f0f4ff;">
            {payer_response or "See full details in ClearClaim dashboard"}
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding: 0 32px 32px; text-align: center;">
      <a href="http://localhost:3000/tasks"
         style="display: inline-block; background: #00d4c8;
                color: #0a0f1e; padding: 12px 32px;
                border-radius: 6px; text-decoration: none;
                font-weight: bold;">
        View in Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #0f1629; padding: 16px 32px;
                border-top: 1px solid #1e2d45; text-align: center;">
      <p style="margin: 0; color: #8892a4; font-size: 12px;">
        ClearClaim — Autonomous Insurance Navigation
      </p>
    </div>
  </div>
</body>
</html>"""

        text = (
            f"ClearClaim — Task Completed\n\n"
            f"Patient: {patient_name}\n"
            f"Task: {task_type.replace('_', ' ').title()}\n"
            f"Payer: {payer}\n"
            f"{'Auth Number: ' + auth_number + chr(10) if auth_number else ''}"
            f"Response: {payer_response}\n\n"
            f"View details: http://localhost:3000/tasks"
        )

        return await self.send(to_email, subject, html, text)

    # ── Notification: task failed / requires human ───────────────────

    async def notify_task_failed(
        self,
        to_email: str,
        patient_name: str,
        task_type: str,
        payer: str,
        failure_reason: str,
        task_id: str,
    ) -> bool:
        """Send when task fails or requires human review."""

        subject = f"⚠️ Review Required — {patient_name} {task_type.replace('_', ' ').title()}"

        html = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0a0f1e;
             color: #f0f4ff; padding: 32px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;
              background: #111827; border-radius: 12px;
              border: 1px solid #1e2d45; overflow: hidden;">

    <div style="background: #0f1629; padding: 24px 32px;
                border-bottom: 1px solid #1e2d45;">
      <h1 style="margin: 0; color: #00d4c8; font-size: 24px;">ClearClaim</h1>
      <p style="margin: 4px 0 0; color: #8892a4; font-size: 12px;
                letter-spacing: 2px; text-transform: uppercase;">
        Autonomous Insurance Navigation
      </p>
    </div>

    <div style="background: #ff4d6a20; border-left: 4px solid #ff4d6a;
                padding: 16px 32px; margin: 24px 32px; border-radius: 4px;">
      <p style="margin: 0; color: #ff4d6a; font-weight: bold; font-size: 16px;">
        ⚠️ Human Review Required
      </p>
      <p style="margin: 8px 0 0; color: #8892a4; font-size: 14px;">
        The agent was unable to complete this task automatically.
      </p>
    </div>

    <div style="padding: 0 32px 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #8892a4;
                      border-bottom: 1px solid #1e2d45; width: 40%;">
            Patient
          </td>
          <td style="padding: 12px 0; color: #f0f4ff;
                      border-bottom: 1px solid #1e2d45; font-weight: bold;">
            {patient_name}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #8892a4;
                      border-bottom: 1px solid #1e2d45;">
            Task
          </td>
          <td style="padding: 12px 0; color: #f0f4ff;
                      border-bottom: 1px solid #1e2d45;">
            {task_type.replace("_", " ").title()} — {payer}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #8892a4;">
            Reason
          </td>
          <td style="padding: 12px 0; color: #ff4d6a;">
            {failure_reason or "Agent encountered an unexpected issue"}
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 0 32px 32px; text-align: center;">
      <a href="http://localhost:3000/tasks"
         style="display: inline-block; background: #ff4d6a;
                color: white; padding: 12px 32px;
                border-radius: 6px; text-decoration: none;
                font-weight: bold;">
        Review in Dashboard
      </a>
    </div>

    <div style="background: #0f1629; padding: 16px 32px;
                border-top: 1px solid #1e2d45; text-align: center;">
      <p style="margin: 0; color: #8892a4; font-size: 12px;">
        ClearClaim — Autonomous Insurance Navigation
      </p>
    </div>
  </div>
</body>
</html>"""

        text = (
            f"ClearClaim — Review Required\n\n"
            f"Patient: {patient_name}\n"
            f"Task: {task_type.replace('_', ' ').title()} — {payer}\n"
            f"Reason: {failure_reason}\n\n"
            f"Review: http://localhost:3000/tasks"
        )

        return await self.send(to_email, subject, html, text)

    # ── Notification: daily summary ──────────────────────────────────

    async def notify_daily_summary(
        self,
        to_email: str,
        practice_name: str,
        stats: dict,
    ) -> bool:
        """Daily digest — called from a scheduled Celery beat task."""

        subject = f"📊 Daily Summary — {practice_name}"

        html = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0a0f1e;
             color: #f0f4ff; padding: 32px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;
              background: #111827; border-radius: 12px;
              border: 1px solid #1e2d45; overflow: hidden;">

    <div style="background: #0f1629; padding: 24px 32px;
                border-bottom: 1px solid #1e2d45;">
      <h1 style="margin: 0; color: #00d4c8; font-size: 24px;">ClearClaim</h1>
      <p style="margin: 4px 0 0; color: #8892a4; font-size: 12px;
                letter-spacing: 2px;">
        DAILY SUMMARY — {practice_name.upper()}
      </p>
    </div>

    <!--[if mso]><table role="presentation" width="100%"><tr>
    <td width="33%"><![endif]-->
    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px;">
        <tr>
          <td style="background: #0f1629; border: 1px solid #1e2d45;
                      border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #f0f4ff;">
              {stats.get("total", 0)}
            </div>
            <div style="color: #8892a4; font-size: 12px;
                        text-transform: uppercase; letter-spacing: 1px;">
              Total Tasks
            </div>
          </td>
          <td style="background: #00c89615; border: 1px solid #00c896;
                      border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #00c896;">
              {stats.get("completed", 0)}
            </div>
            <div style="color: #8892a4; font-size: 12px;
                        text-transform: uppercase; letter-spacing: 1px;">
              Completed
            </div>
          </td>
          <td style="background: #ff4d6a15; border: 1px solid #ff4d6a;
                      border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #ff4d6a;">
              {stats.get("requires_human", 0)}
            </div>
            <div style="color: #8892a4; font-size: 12px;
                        text-transform: uppercase; letter-spacing: 1px;">
              Need Review
            </div>
          </td>
        </tr>
      </table>
    </div>
    <!--[if mso]></td></tr></table><![endif]-->

    <div style="padding: 0 32px 32px; text-align: center;">
      <a href="http://localhost:3000/dashboard"
         style="display: inline-block; background: #00d4c8;
                color: #0a0f1e; padding: 12px 32px;
                border-radius: 6px; text-decoration: none;
                font-weight: bold;">
        View Full Dashboard
      </a>
    </div>

    <div style="background: #0f1629; padding: 16px 32px;
                border-top: 1px solid #1e2d45; text-align: center;">
      <p style="margin: 0; color: #8892a4; font-size: 12px;">
        ClearClaim — Autonomous Insurance Navigation
      </p>
    </div>
  </div>
</body>
</html>"""

        text = (
            f"ClearClaim Daily Summary — {practice_name}\n\n"
            f"Total Tasks: {stats.get('total', 0)}\n"
            f"Completed: {stats.get('completed', 0)}\n"
            f"Need Review: {stats.get('requires_human', 0)}\n\n"
            f"Dashboard: http://localhost:3000/dashboard"
        )

        return await self.send(to_email, subject, html, text)


# Singleton
mail_service = MailService()
