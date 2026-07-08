import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import settings

_ITERATIONS = 260_000
_ALGORITHM = "sha256"


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(_ALGORITHM, password.encode(), salt.encode(), _ITERATIONS)
    return f"pbkdf2:{_ALGORITHM}:{_ITERATIONS}:{salt}:{key.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _, algorithm, iterations, salt, expected = hashed.split(":")
        key = hashlib.pbkdf2_hmac(algorithm, plain.encode(), salt.encode(), int(iterations))
        return secrets.compare_digest(key.hex(), expected)
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
