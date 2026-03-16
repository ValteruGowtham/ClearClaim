"""
Authentication routes — register, login, and profile.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Request / Response schemas ──────────────────────────────────────


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    practice_name: str
    practice_type: str | None = None
    physician_count: str | None = None
    primary_specialty: str | None = None
    phone: str | None = None
    role: str = "biller"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    practice_name: str
    practice_type: str | None = None
    physician_count: str | None = None
    primary_specialty: str | None = None
    phone: str | None = None
    role: str
    is_active: bool
    created_at: datetime


# ── Endpoints ───────────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(body: RegisterRequest):
    """Create a new user account."""
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        practice_name=body.practice_name,
        practice_type=body.practice_type,
        physician_count=body.physician_count,
        primary_specialty=body.primary_specialty,
        phone=body.phone,
        role=body.role,
    )
    await user.insert()

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        practice_name=user.practice_name,
        practice_type=user.practice_type,
        physician_count=user.physician_count,
        primary_specialty=user.primary_specialty,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Authenticate and return a JWT access token."""
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        practice_name=current_user.practice_name,
        practice_type=current_user.practice_type,
        physician_count=current_user.physician_count,
        primary_specialty=current_user.primary_specialty,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )
