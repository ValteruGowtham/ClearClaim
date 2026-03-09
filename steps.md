Step 1 — The Project Skeleton
Think of this as building the empty rooms of a house before putting furniture in.
The Monorepo Structure
We created one parent folder clearclaim/ that holds both the backend and frontend together. This is called a monorepo — one repository, two applications. It keeps everything organized and easy to deploy together.
Backend — FastAPI (Python)
FastAPI is the web framework that handles all incoming requests from the frontend or any external service. When the frontend says "give me a list of patients", FastAPI receives that request, processes it, talks to the database, and sends back the answer. We used uv as the package manager — it's significantly faster than regular pip for installing Python libraries.
Frontend — Next.js 14
This is the dashboard your users (clinic staff) will actually see and interact with in their browser. Next.js is built on React but adds server-side rendering which makes pages load faster and perform better. We set it up with TypeScript (safer, catches errors before runtime) and Tailwind CSS (utility-based styling — no writing CSS from scratch).
Docker Compose — MongoDB + Redis
Instead of installing databases directly on your machine, we run them inside Docker containers — isolated, portable mini-environments. Two containers were set up:

MongoDB on port 27017 — this is our main database where all data lives
Redis on port 6379 — this is a fast in-memory store used for task queuing (Celery will push agent jobs here)


Step 2 — The Data Models + Auth System
This is where the application gets its brain and memory.

MongoDB Models (via Beanie)
Beanie is an ODM — Object Document Mapper. It lets us define Python classes that map directly to MongoDB collections. Instead of writing raw database queries, we work with clean Python objects.
We created three core models:
User model
Represents a clinic/practice that signs up on ClearClaim. Every piece of data in the system is tied to a practice_id which comes from this user. Roles (admin, biller, provider, readonly) control what each person can see and do inside the dashboard.
Patient model
Stores the patient information needed to run insurance tasks — their name, date of birth, member ID, and which insurance company covers them. Every patient belongs to a practice via practice_id.
Task model
This is the most important model in the entire application. A Task represents one unit of work the AI agent will perform — a prior authorization submission, an eligibility check, a claim status lookup, or a denial appeal. It tracks:

What needs to be done (task_type)
Where it is in the process (status) — pending → in progress → completed/failed
What the agent found (result, auth_number)
Every step the agent took (agent_trace) — critical for audit and debugging


Authentication System (JWT)
We built a complete login system from scratch using JWT — JSON Web Tokens.
Here's how it works in plain terms:

A user registers with email + password → password gets hashed (scrambled with bcrypt so even we can't read it) and stored in MongoDB
User logs in → server verifies password hash → if correct, generates a JWT token (a long encrypted string)
On every future request, the frontend sends that token in the request header → server decodes it to know who is making the request
Token expires after 60 minutes for security

The get_current_user() dependency is a FastAPI feature — it runs automatically on any protected route and extracts the user identity from the token. You never have to manually check "is this person logged in?" — FastAPI does it for every protected endpoint automatically.

API Routes — The Doors Into Your Application
Routes are the URLs your frontend calls to interact with the backend. We have three groups:
Route GroupWhat It Does/api/auth/*Register, login, get current user/api/patients/*Create and list patients/api/tasks/*Create, list, and update tasks (agent stubs for now)
The /api/tasks routes are stubs right now — they save and retrieve tasks from MongoDB but don't trigger any agent yet. That's intentional. We wire in TinyFish once the foundation is solid.

The Swagger UI at /docs
FastAPI auto-generates this — it's a live, interactive documentation page for every route. You can test your API directly from the browser without needing Postman or any other tool. When you show this to investors or technical co-founders, it immediately signals that the project is real and well-structured.

🏗️ Where We Are in the Overall Architecture
✅ Project structure         — Done
✅ MongoDB + Redis running   — Done
✅ User authentication       — Done
✅ Core data models          — Done
✅ Base API routes           — Done
⬜ Agent orchestration layer — Next
⬜ TinyFish integration      — After that
⬜ Frontend dashboard        — Parallel to agent work
⬜ Task queue (Celery)       — When agent is ready
