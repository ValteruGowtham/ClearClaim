from datetime import datetime

import redis as redis_lib
from fastapi import APIRouter

from app.config import get_settings
from app.models.user import User

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "clearclaim-api"}


@router.get("/health/detailed")
async def health_detailed():
    """Detailed health check for monitoring and frontend status indicator."""
    settings = get_settings()

    # Database check
    try:
        await User.find_one()
        db_status = "connected"
    except Exception:
        db_status = "error"

    # Redis check
    try:
        r = redis_lib.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        r.close()
        redis_status = "connected"
    except Exception:
        redis_status = "error"

    tinyfish_status = "configured" if settings.TINYFISH_API_KEY else "not configured"
    agentmail_status = "configured" if settings.AGENTMAIL_API_KEY else "not configured"

    return {
        "status": "ok",
        "service": "clearclaim-api",
        "version": "0.1.0",
        "database": db_status,
        "redis": redis_status,
        "tinyfish": tinyfish_status,
        "agentmail": agentmail_status,
        "timestamp": datetime.utcnow().isoformat(),
    }
