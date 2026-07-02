from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from core.database import SessionLocal
import crud.meal_log
from schemas.meal_log import MealLogCreate, MealLogResponse, MealLogUpdate

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

# Úprava existujícího záznamu
@router.put("/{log_id}", response_model=MealLogResponse)
def update_meal_log(log_id: int, log_data: MealLogUpdate, db: Session = Depends(get_db)):
    """Upraví existující záznam v deníčku."""
    
    # Získá jen ta data, která uživatel chce změnit
    update_data = log_data.model_dump(exclude_unset=True)
    
    updated_log = crud.meal_log.update_meal_log(db, log_id, **update_data)
    
    if not updated_log:
        raise HTTPException(status_code=404, detail="Záznam v deníčku nebyl nalezen")
        
    return updated_log


# Odstranění záznamu
@router.delete("/{log_id}")
def delete_meal_log(log_id: int, db: Session = Depends(get_db)):
    """Smaže záznam z deníčku."""
    success = crud.meal_log.delete_meal_log(db, log_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Záznam v deníčku nebyl nalezen")
        
    return {"message": "Záznam z deníčku úspěšně smazán"}

@router.get("/{user_id}/date/{target_date}", response_model=list[MealLogResponse])
def get_user_logs_by_date(user_id: int, target_date: date, db: Session = Depends(get_db)):
    """Vrátí deníček pro konkrétní den (uživatel posílá formát YYYY-MM-DD)."""
    return crud.meal_log.get_logs_by_date(db, user_id, target_date)