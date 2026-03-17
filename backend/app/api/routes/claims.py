from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/claims", tags=["claims"])


@router.get("/")
async def list_claims():
    """# NOT IMPLEMENTED: claims listing endpoint is not wired to persistence yet."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Claims listing is not implemented yet.",
    )
