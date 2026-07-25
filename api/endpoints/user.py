from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import SessionLocal
import crud.user
from schemas.user import UserCreate, UserResponse
from api.deps import get_current_user
from models.user import User


router = APIRouter()

# Dependency pro otevření a zavření spojení s databází
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoint pro načtení profilu aktuálního uživatele
@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Vrátí profil aktuálně přihlášeného uživatele podle JWT tokenu.
    """
    return current_user

# Metoda POST pro vytvoření uživatele
@router.post("/", response_model=UserResponse)
def create_new_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Vytvoří nového uživatele.
    """
    
    # Kontrola, zda uživatel s tímto jménem neexistuje
    existing_user = crud.user.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Uživatel s tímto jménem už existuje!")
    
    # Předá vyfiltrovaná data do CRUD vrstvy a ta to uloží.
    new_user = crud.user.create_user(
        session=db,
        username=user_data.username,
        password=user_data.password,
        calories_goal=user_data.daily_calories_goal,
        fat_goal=user_data.daily_fat_goal,
        saturates_goal=user_data.daily_saturates_goal,
        carbs_goal=user_data.daily_carbs_goal,
        sugar_goal=user_data.daily_sugar_goal,
        protein_goal=user_data.daily_protein_goal,
        salt_goal=user_data.daily_salt_goal
    )
    
    # FastAPI si z "new_user" vezme ty správné údaje a pošle je uživateli zpět.
    return new_user
