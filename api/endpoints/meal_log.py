from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import SessionLocal
import crud.meal_log
from schemas.meal_log import MealLogCreate, MealLogResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Z adresy se bere user_id (uživatel, do jehož deníčku zapisujeme)
@router.post("/{user_id}", response_model=MealLogResponse)
def log_meal(user_id: int, log_data: MealLogCreate, db: Session = Depends(get_db)):
    """Zaznamená jídlo do deníčku uživatele."""
    new_log = crud.meal_log.log_meal(
        session=db,
        user_id=user_id,
        meal_type=log_data.meal_type,
        food_id=log_data.food_id,
        recipe_id=log_data.recipe_id,
        amount_grams=log_data.amount_grams,
        date_consumed=log_data.date_consumed
    )
    return new_log

@router.get("/{user_id}", response_model=list[MealLogResponse])
def get_user_logs(user_id: int, db: Session = Depends(get_db)):
    """Vrátí celý deníček (historii) konkrétního uživatele."""
    return crud.meal_log.get_user_logs(db, user_id)
