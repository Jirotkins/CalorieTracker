from datetime import datetime, date
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from models.meal_log import MealLog

def get_meal_log(session: Session, log_id: int) -> MealLog | None:
    """Najde konkrétní záznam v deníčku podle ID."""
    return session.get(MealLog, log_id)

def log_meal(
    session: Session,
    user_id: int,
    meal_type: str, # Např. "Snídaně", "Oběd"
    food_id: int | None = None,
    recipe_id: int | None = None,
    amount_grams: int | None = None,
    portion_id: int | None = None,
    date_consumed: datetime | None = None
) -> MealLog:
    """Zaznamená snědené jídlo nebo recept do deníčku."""
    new_log = MealLog(
        user_id=user_id,
        food_id=food_id,
        recipe_id=recipe_id,
        meal_type=meal_type,
        amount_grams=amount_grams,
        portion_id=portion_id
    )
    if date_consumed:
        new_log.date_consumed = date_consumed
    
    session.add(new_log)
    session.commit()
    session.refresh(new_log)
    return new_log

def get_user_logs(session: Session, user_id: int) -> list[MealLog]:
    """Vytáhne z databáze vše, co tento uživatel kdy snědl."""
    query = select(MealLog).where(MealLog.user_id == user_id)
    return list(session.scalars(query).all())

def update_meal_log(session: Session, log_id: int, **kwargs) -> MealLog | None:
    """Upraví záznam v deníčku."""
    meal_log = get_meal_log(session, log_id)
    if not meal_log:
        return None
        
    for key, value in kwargs.items():
        setattr(meal_log, key, value)
        
    session.commit()
    session.refresh(meal_log)
    return meal_log

def delete_meal_log(session: Session, log_id: int) -> bool:
    """Smaže záznam z deníčku."""
    meal_log = get_meal_log(session, log_id)
    if not meal_log:
        return False
        
    session.delete(meal_log)
    session.commit()
    return True

def get_logs_by_date(session: Session, user_id: int, target_date: date) -> list[MealLog]:
    """Vrátí všechna jídla snědená v jeden konkrétní den (ignoruje hodiny a minuty)."""
    
    query = select(MealLog).where(
        MealLog.user_id == user_id,
        func.date(MealLog.date_consumed) == target_date
    )
    return list(session.scalars(query).all())