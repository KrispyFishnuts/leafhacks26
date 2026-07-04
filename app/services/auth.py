from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from jose import jwt, JWTError

from app.services.db import SessionLocal, User

# Hackathon-only secret - fine for now, but never reuse this value beyond the event
SECRET_KEY = "leafhacks26-change-this-secret-before-any-real-deployment"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_user(email: str, password: str) -> User:
    db = SessionLocal()
    try:
        if db.query(User).filter_by(email=email).first():
            raise ValueError("That email already has an account.")
        user = User(email=email, hashed_password=pwd_context.hash(password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def authenticate_user(email: str, password: str) -> User:
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not pwd_context.verify(password, user.hashed_password):
            raise ValueError("Incorrect email or password.")
        return user
    finally:
        db.close()


def create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise ValueError("Your session has expired. Please sign in again.")