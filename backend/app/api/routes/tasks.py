"""
Task routes — CRUD + agent dispatch via Celery.
"""

from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.models.patient import Patient
from app.models.task import Task
from app.models.user import User
from app.workers.tasks import run_agent_task

router = APIRouter(prefix="/tasks", tags=["tasks"])


# ── Request / Response schemas ──────────────────────────────────────


class TaskCreate(BaseModel):
    patient_id: str
    task_type: Literal["prior_auth", "eligibility", "claim_status", "appeal"]
    payer: str
    procedure_code: Optional[str] = None
    diagnosis_code: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: Literal[
        "pending", "in_progress", "completed", "failed", "requires_human"
    ]


class TaskResponse(BaseModel):
    id: str
    practice_id: str
    patient_id: str
    patient_name: Optional[str] = None
    task_type: str
    status: str
    payer: str
    procedure_code: Optional[str] = None
    diagnosis_code: Optional[str] = None
    result: Optional[dict[str, Any]] = None
    auth_number: Optional[str] = None
    failure_reason: Optional[str] = None
    agent_trace: Optional[list[dict[str, Any]]] = None
    tinyfish_run_id: Optional[str] = None
    streaming_url: Optional[str] = None
    progress_steps: list[str] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


def _task_response(t: Task) -> TaskResponse:
    return TaskResponse(
        id=str(t.id),
        practice_id=t.practice_id,
        patient_id=t.patient_id,
        patient_name=t.patient_name,
        task_type=t.task_type,
        status=t.status,
        payer=t.payer,
        procedure_code=t.procedure_code,
        diagnosis_code=t.diagnosis_code,
        result=t.result,
        auth_number=t.auth_number,
        failure_reason=t.failure_reason,
        agent_trace=t.agent_trace,
        tinyfish_run_id=t.tinyfish_run_id,
        streaming_url=t.streaming_url,
        progress_steps=t.progress_steps,
        created_at=t.created_at,
        updated_at=t.updated_at,
        completed_at=t.completed_at,
    )


# ── Endpoints ───────────────────────────────────────────────────────


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
):
    """List tasks for the current practice with optional pagination and sort."""
    query = Task.find(Task.practice_id == str(current_user.id))
    sort_field = f"-{sort_by}" if sort_order == "desc" else sort_by
    try:
        tasks = await query.sort(sort_field).skip(skip).limit(limit).to_list()
    except Exception:
        tasks = await query.to_list()
        tasks.sort(
            key=lambda t: getattr(t, sort_by, t.created_at),
            reverse=(sort_order == "desc"),
        )
        tasks = tasks[skip: skip + limit]
    return [_task_response(t) for t in tasks]


@router.get("/stats")
async def task_stats(current_user: User = Depends(get_current_user)):
    """Return a comprehensive status summary for the current practice."""
    practice_id = str(current_user.id)
    all_tasks = await Task.find(Task.practice_id == practice_id).to_list()

    counts: dict[str, Any] = {
        "total": 0,
        "pending": 0,
        "in_progress": 0,
        "completed": 0,
        "failed": 0,
        "requires_human": 0,
    }
    completion_times: list[float] = []
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    tasks_today = 0

    for t in all_tasks:
        counts["total"] += 1
        if t.status in counts:
            counts[t.status] += 1
        # Completion time
        if t.status == "completed" and t.completed_at and t.created_at:
            delta = (t.completed_at - t.created_at).total_seconds()
            if delta > 0:
                completion_times.append(delta)
        # Tasks today
        created = t.created_at
        if created.tzinfo is None:
            from datetime import timezone as _tz
            created = created.replace(tzinfo=_tz.utc)
        if created >= today_start:
            tasks_today += 1

    completed_count = counts["completed"]
    total_count = counts["total"]
    avg_completion = (
        sum(completion_times) / len(completion_times) if completion_times else 0.0
    )
    time_saved = completed_count * 35  # 35 minutes per task
    success_rate = round(completed_count / total_count * 100, 1) if total_count > 0 else 0.0

    return {
        **counts,
        "avg_completion_seconds": round(avg_completion, 1),
        "time_saved_minutes": time_saved,
        "success_rate": success_rate,
        "tasks_today": tasks_today,
    }


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new task and enqueue it for background agent processing."""
    # Look up patient name to denormalise onto the task
    patient_name: Optional[str] = None
    try:
        patient = await Patient.get(UUID(body.patient_id))
        if patient:
            patient_name = patient.full_name
    except Exception:
        pass

    task = Task(
        practice_id=str(current_user.id),
        patient_id=body.patient_id,
        patient_name=patient_name,
        task_type=body.task_type,
        payer=body.payer,
        procedure_code=body.procedure_code,
        diagnosis_code=body.diagnosis_code,
    )
    await task.insert()

    # Dispatch to Celery — the agent runs in the background
    run_agent_task.delay(str(task.id))

    return _task_response(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single task by ID (scoped to current practice)."""
    try:
        task = await Task.get(UUID(task_id))
    except (ValueError, Exception):
        task = None

    if not task or task.practice_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return _task_response(task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    body: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update the status of a task."""
    try:
        task = await Task.get(UUID(task_id))
    except (ValueError, Exception):
        task = None

    if not task or task.practice_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    task.status = body.status
    task.updated_at = datetime.utcnow()
    if body.status == "completed":
        task.completed_at = datetime.utcnow()
    await task.save()
    return _task_response(task)


@router.get("/{task_id}/stream-info")
async def get_stream_info(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return streaming metadata for a task."""
    try:
        task = await Task.get(UUID(task_id))
    except (ValueError, Exception):
        task = None

    if not task or task.practice_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return {
        "task_id": str(task.id),
        "status": task.status,
        "streaming_url": task.streaming_url,
        "progress_steps": task.progress_steps,
        "tinyfish_run_id": task.tinyfish_run_id,
    }


@router.get("/{task_id}/result", response_model=TaskResponse)
async def get_task_result(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return a task with its full result and agent_trace (for polling)."""
    try:
        task = await Task.get(UUID(task_id))
    except (ValueError, Exception):
        task = None

    if not task or task.practice_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return _task_response(task)
