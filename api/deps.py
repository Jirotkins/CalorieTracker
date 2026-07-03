from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
import crud.user
from models.user import User

# Převážně pro FastAPI?
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Závislost, která zkontroluje token a vrátí aktuálně přihlášeného uživatele."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nelze ověřit přihlašovací údaje",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Rozšifruje token pomocí tajného klíče
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Kontrola, zda uživatel stále existuje v databázi
    user = crud.user.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
        
    return user
