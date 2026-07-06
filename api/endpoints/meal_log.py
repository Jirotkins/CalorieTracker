from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from core.database import SessionLocal
import crud.meal_log
from schemas.meal_log import MealLogCreate, MealLogResponse, MealLogUpdate, DailySummary, MealGroupSummary, LogItemResponse
from api.deps import get_current_user
from models.user import User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Z adresy se bere user_id (uživatel, do jehož deníčku zapisujeme)
@router.post("/", response_model=MealLogResponse)
def log_meal(log_data: MealLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Zaznamená jídlo do deníčku uživatele."""
    new_log = crud.meal_log.log_meal(
        session=db,
        user_id=current_user.id,
        meal_type=log_data.meal_type,
        food_id=log_data.food_id,
        recipe_id=log_data.recipe_id,
        amount_grams=log_data.amount_grams,
        portion_id=log_data.portion_id,
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

@router.get("/date/{target_date}", response_model=DailySummary)
def get_user_logs_by_date(target_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vrátí deníček pro konkrétní den (uživatel posílá formát YYYY-MM-DD)."""
    logs = crud.meal_log.get_logs_by_date(db, current_user.id, target_date)
    daily_calories = 0
    daily_fats = 0.0
    daily_saturates = 0.0
    daily_carbs = 0.0
    daily_sugar = 0.0
    daily_protein = 0.0
    daily_salt = 0.0

    groups = {
        "breakfast": MealGroupSummary(
            meal_type="breakfast",
            total_calories=0,
            total_fat=0.0,
            total_saturates=0.0,
            total_carbs=0.0,
            total_sugar=0.0,
            total_protein=0.0,
            total_salt=0.0,
            items=[]),
        "morning_snack": MealGroupSummary(
            meal_type="morning_snack",
            total_calories=0,
            total_fat=0.0,
            total_saturates=0.0,
            total_carbs=0.0,
            total_sugar=0.0,
            total_protein=0.0,
            total_salt=0.0,
            items=[]),
        "lunch": MealGroupSummary(
            meal_type="lunch",
            total_calories=0,
            total_fat=0.0,
            total_saturates=0.0,
            total_carbs=0.0,
            total_sugar=0.0,
            total_protein=0.0,
            total_salt=0.0,
            items=[]),
        "afternoon_snack": MealGroupSummary(
            meal_type="afternoon_snack",
            total_calories=0,
            total_fat=0.0,
            total_saturates=0.0,
            total_carbs=0.0,
            total_sugar=0.0,
            total_protein=0.0,
            total_salt=0.0,
            items=[]),
        "dinner": MealGroupSummary(
            meal_type="dinner",
            total_calories=0,
            total_fat=0.0,
            total_saturates=0.0,
            total_carbs=0.0,
            total_sugar=0.0,
            total_protein=0.0,
            total_salt=0.0,
            items=[])
    }
    for log in logs:
        if log.food:
            if log.portion:
                grams = log.portion.weight_grams
                portion_name = log.portion.name
            else:
                grams = log.amount_grams or 100
                portion_name = None

            multiplier = grams / 100.0
            cal = int(log.food.calories_per_100g * multiplier)
            fat = log.food.fat_per_100g * multiplier
            sat = log.food.saturates_per_100g * multiplier
            carb = log.food.carbs_per_100g * multiplier
            sug = log.food.sugar_per_100g * multiplier
            prot = log.food.protein_per_100g * multiplier
            salt = log.food.salt_per_100g * multiplier

            item = LogItemResponse(
                id=log.id,
                food_name=log.food.name,
                amount_grams=grams,
                calories=cal,
                fat=fat,
                saturates=sat,
                carbs=carb,
                sugar=sug,
                protein=prot,
                salt=salt,
                portion_name=portion_name
                )

            groups[log.meal_type].total_calories += cal
            groups[log.meal_type].total_fat += fat
            groups[log.meal_type].total_saturates += sat
            groups[log.meal_type].total_carbs += carb
            groups[log.meal_type].total_sugar += sug
            groups[log.meal_type].total_protein += prot
            groups[log.meal_type].total_salt += salt
            groups[log.meal_type].items.append(item)

            daily_calories += cal
            daily_fats += fat
            daily_saturates += sat
            daily_carbs += carb
            daily_sugar += sug
            daily_protein += prot
            daily_salt += salt

        elif log.recipe:
            pass

    return DailySummary(
        total_calories=daily_calories,
        total_fat=daily_fats,
        total_saturates=daily_saturates,
        total_carbs=daily_carbs,
        total_sugar=daily_sugar,
        total_protein=daily_protein,
        total_salt=daily_salt,

        goal_calories=current_user.daily_calories_goal,
        goal_fat=current_user.daily_fat_goal,
        goal_saturates=current_user.daily_saturates_goal,
        goal_carbs=current_user.daily_carbs_goal,
        goal_sugar=current_user.daily_sugar_goal,
        goal_protein=current_user.daily_protein_goal,
        goal_salt=current_user.daily_salt_goal,

        meal_groups=list(groups.values())
    )