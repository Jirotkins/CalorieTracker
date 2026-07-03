from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

# Nástroj na hashování hesla
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Zašifruje čisté heslo do hashe."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Ověří, zda čisté heslo od uživatele sedí na hash v databázi."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Vytvoří a podepíše JWT token."""
    to_encode = data.copy()
    
    # Spočítá, kdy přesně JWT token vyprší
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Podepíše se to tajným klíčem z config.py
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
