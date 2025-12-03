import os
import logging
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("auth")

# Use argon2 which has no length limits and is more secure than bcrypt
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    logger.info("/auth/register requested for email=%s", req.email)
    try:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            logger.info("/auth/register email already exists: %s", req.email)
            raise HTTPException(status_code=400, detail="Email already registered")

        pw_hash = pwd_context.hash(req.password)
        user = User(email=req.email, password_hash=pw_hash, vehicle_id=req.vehicle_id)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("/auth/register success user_id=%s email=%s", user.id, req.email)

        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/auth/register failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    logger.info("/auth/login requested for email=%s", req.email)
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not pwd_context.verify(req.password, user.password_hash):
            logger.info("/auth/login invalid credentials for email=%s", req.email)
            raise HTTPException(status_code=400, detail="Invalid credentials")

        token = create_access_token(str(user.id))
        logger.info("/auth/login success user_id=%s email=%s", user.id, req.email)
        return TokenResponse(access_token=token)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/auth/login failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Login failed")
