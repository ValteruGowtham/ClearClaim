"""
Celery application — background task queue with Redis broker & backend.
"""

from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "clearclaim",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Auto-discover tasks in app.workers.tasks
celery_app.autodiscover_tasks(["app.workers"])

# Daily summary email at 7:00 AM UTC
celery_app.conf.beat_schedule = {
    "daily-summary": {
        "task": "send_daily_summaries",
        "schedule": crontab(hour=7, minute=0),
    },
}
