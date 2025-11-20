"""
Supabase Authentication for EDoS Security Dashboard
Handles JWT verification from Supabase Auth
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
import jwt
import os
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.database import UserProfile
from app.supabase_client import get_supabase_client

router = APIRouter()
security = HTTPBearer()

# Supabase JWT Secret (get from Supabase dashboard -> Settings -> API)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "your-jwt-secret-from-supabase")


async def verify_token(token: str = Depends(security)) -> dict:
    """Verify Supabase JWT token"""
    try:
        # Decode the JWT token
        payload = jwt.decode(
            token.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase tokens don't always have aud
        )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role"),
            "exp": payload.get("exp"),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


async def get_current_user(
    token_data: dict = Depends(verify_token), db: Session = Depends(get_db)
) -> UserProfile:
    """Get current user from database using Supabase auth"""

    user_id = token_data["user_id"]

    # Try to find existing user profile
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()

    if not user_profile:
        # Create new user profile if doesn't exist
        user_profile = UserProfile(
            id=user_id,
            email=token_data.get("email"),
            username=token_data.get("email", "").split("@")[
                0
            ],  # Use email prefix as username
            role="analyst",
        )
        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)

    return user_profile


async def get_current_user_id(token_data: dict = Depends(verify_token)) -> str:
    """Get just the user ID from token (lighter than full user object)"""
    return token_data["user_id"]


async def require_role(required_roles: list):
    """Dependency factory for role-based access control"""

    def role_checker(current_user: UserProfile = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {required_roles}, current role: {current_user.role}",
            )
        return current_user

    return role_checker
