from fastapi import APIRouter

router = APIRouter(prefix="/claims", tags=["claims"])


@router.get("/")
async def list_claims():
    """List all claims — stub endpoint."""
    return {"claims": [], "total": 0}
