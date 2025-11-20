"""
Authentication endpoints for the EDoS Security Dashboard
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr
import jwt
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import bcrypt
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.database import User, UserSession, UserSettings
import uuid

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime


def hash_password(password: str) -> tuple[str, str]:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    password_hash = bcrypt.hashpw(
        (password + salt).encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    return password_hash, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw((password + salt).encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


def get_current_user(
    token: str = Depends(security), db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = (
        db.query(User).filter(User.username == username, User.is_active == True).first()
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = (
        db.query(User)
        .filter((User.username == request.username) | (User.email == request.email))
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400, detail="Username or email already registered"
        )

    # Hash password
    password_hash, salt = hash_password(request.password)

    # Create new user
    new_user = User(
        id=uuid.uuid4(),
        username=request.username,
        email=request.email,
        password_hash=password_hash,
        salt=salt,
        first_name=request.first_name,
        last_name=request.last_name,
        role="analyst",
        is_active=True,
        email_verified=False,
    )

    db.add(new_user)
    db.flush()  # Get the ID

    # Create default user settings
    user_settings = UserSettings(
        user_id=new_user.id,
        theme="dark",
        timezone="UTC",
        language="en",
        session_timeout=30,
        auto_logout=True,
        notification_email=True,
        alert_threshold="medium",
    )

    db.add(user_settings)
    db.commit()

    # Create access token
    access_token = create_access_token({"sub": new_user.username})

    # Store session
    token_hash = hashlib.sha256(access_token.encode()).hexdigest()
    session = UserSession(
        user_id=new_user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    db.add(session)
    db.commit()

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
        },
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    # Find user
    user = (
        db.query(User)
        .filter(User.username == request.username, User.is_active == True)
        .first()
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify password
    if not verify_password(request.password, user.password_hash, user.salt):
        # Increment failed login attempts
        user.login_attempts += 1
        if user.login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.commit()

        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=423,
            detail="Account temporarily locked due to too many failed login attempts",
        )

    # Reset login attempts and update last login
    user.login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token = create_access_token({"sub": user.username})

    # Store session
    token_hash = hashlib.sha256(access_token.encode()).hexdigest()
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    db.add(session)
    db.commit()

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
    )


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        created_at=current_user.created_at,
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Logout user (invalidate all sessions)"""
    # Delete all user sessions to logout from all devices
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.commit()

    return {"message": "Successfully logged out from all devices"}
