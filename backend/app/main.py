import asyncio
import logging
from contextlib import asynccontextmanager
from uuid import UUID

import redis
from beanie import init_beanie
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.api.routes import auth, claims, health, patients, tasks
from app.core.security import hash_password
from app.models.claim import Claim
from app.models.patient import Patient
from app.models.task import Task
from app.models.user import User

logger = logging.getLogger(__name__)

DEMO_EMAIL = "demo@clearclaim.ai"
DEMO_PASSWORD = "Demo1234!"


async def _ensure_demo_account() -> None:
    """Create demo account on startup if it doesn't already exist."""
    existing = await User.find_one(User.email == DEMO_EMAIL)
    if existing:
        logger.info("✓ Demo account ready: %s", DEMO_EMAIL)
        return
    demo = User(
        email=DEMO_EMAIL,
        hashed_password=hash_password(DEMO_PASSWORD),
        full_name="Demo User",
        practice_name="Demo Medical Clinic",
        role="admin",
    )
    await demo.insert()
    logger.info("✓ Demo account created: %s", DEMO_EMAIL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup, clean up on shutdown."""
    settings = get_settings()

    # Connect to MongoDB & init Beanie ODM
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    await init_beanie(
        database=db,
        document_models=[User, Patient, Task, Claim],
    )
    app.state.mongo_client = client

    # Ensure demo account exists
    await _ensure_demo_account()

    # Verify Redis / Celery broker connectivity
    try:
        r = redis.Redis.from_url(settings.REDIS_URL)
        r.ping()
        logger.info("Redis connection OK (%s)", settings.REDIS_URL)
        r.close()
    except Exception as exc:
        logger.warning(
            "Redis is unreachable at %s — background tasks will not run: %s",
            settings.REDIS_URL,
            exc,
        )

    yield

    # Shutdown
    client.close()


app = FastAPI(
    title="ClearClaim API",
    description="Claims management platform API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router)
app.include_router(auth.router, prefix="/api")
app.include_router(claims.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")


# ── WebSocket: live task progress ────────────────────────────────────

@app.websocket("/ws/tasks/{task_id}/progress")
async def task_progress_ws(websocket: WebSocket, task_id: str):
    """Stream task progress steps and status over WebSocket."""
    await websocket.accept()

    last_step_count = 0

    try:
        while True:
            # Fetch latest task from DB
            try:
                task = await Task.get(UUID(task_id))
            except (ValueError, Exception):
                task = None

            if not task:
                await websocket.send_json({"type": "error", "error": "Task not found"})
                break

            # Send any new progress steps
            current_steps = task.progress_steps or []
            if len(current_steps) > last_step_count:
                new_steps = current_steps[last_step_count:]
                for step in new_steps:
                    await websocket.send_json({
                        "type": "progress",
                        "step": step,
                        "total_steps": len(current_steps),
                    })
                last_step_count = len(current_steps)

            # Send status update
            await websocket.send_json({
                "type": "status",
                "status": task.status,
                "streaming_url": task.streaming_url,
            })

            # Stop streaming when terminal status reached
            if task.status in ("completed", "failed", "requires_human"):
                await websocket.send_json({"type": "done", "status": task.status})
                break

            # Poll every 2 seconds
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error for task %s", task_id)
