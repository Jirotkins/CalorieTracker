from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import get_args

from core.database import SessionLocal
import crud.meal_log
from schemas.meal_log import MealLogCreate, MealLogResponse, MealLogUpdate, DailySummary, MealGroupSummary, LogItemResponse, MealType
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
        recipe_portion_id=log_data.recipe_portion_id,
        date_consumed=log_data.date_consumed
    )
    return new_log


# Klíče maker (odpovídají polím *_per_100g v Food/Recipe a total_* v souhrnech)
NUTRIENT_KEYS = ("calories", "fat", "saturates", "carbs", "sugar", "protein", "salt")

def _nutrients_for(source, grams: int) -> dict:
    """Spočítá makra pro dané množství jídla nebo receptu (v DB jsou hodnoty na 100 g)."""
    multiplier = grams / 100.0
    nutrients = {key: getattr(source, f"{key}_per_100g") * multiplier for key in NUTRIENT_KEYS}
    nutrients["calories"] = int(nutrients["calories"])
    return nutrients

@router.get("/date/{target_date}", response_model=DailySummary)
def get_user_logs_by_date(target_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vrátí deníček pro konkrétní den (uživatel posílá formát YYYY-MM-DD)."""

    logs = crud.meal_log.get_logs_by_date(db, current_user.id, target_date)
    groups = {meal_type: MealGroupSummary(meal_type=meal_type) for meal_type in get_args(MealType)}

    for log in logs:
        # Záznam je buď jídlo, nebo recept (každý s vlastním typem porce)
        if log.food:
            source, portion = log.food, log.portion
        elif log.recipe:
            source, portion = log.recipe, log.recipe_portion
        else:
            continue

        if portion:
            grams = portion.weight_grams
            portion_name = portion.name
        else:
            grams = log.amount_grams or 100
            portion_name = None

        nutrients = _nutrients_for(source, grams)
        item = LogItemResponse(
            id=log.id,
            meal_type=log.meal_type,
            food_id=log.food_id,
            recipe_id=log.recipe_id,
            portion_id=log.portion_id,
            recipe_portion_id=log.recipe_portion_id,
            food_name=log.food.name if log.food else None,
            recipe_name=log.recipe.name if log.recipe else None,
            amount_grams=grams,
            portion_name=portion_name,
            **nutrients
        )

        # Přičte makra položky do součtu jejího jídla dne
        group = groups[log.meal_type]
        for key, value in nutrients.items():
            setattr(group, f"total_{key}", getattr(group, f"total_{key}") + value)
        group.items.append(item)

    # Denní součty = součet všech jídel dne
    totals = {
        f"total_{key}": sum(getattr(group, f"total_{key}") for group in groups.values())
        for key in NUTRIENT_KEYS
    }

    return DailySummary(
        **totals,

        goal_calories=current_user.daily_calories_goal,
        goal_fat=current_user.daily_fat_goal,
        goal_saturates=current_user.daily_saturates_goal,
        goal_carbs=current_user.daily_carbs_goal,
        goal_sugar=current_user.daily_sugar_goal,
        goal_protein=current_user.daily_protein_goal,
        goal_salt=current_user.daily_salt_goal,

        meal_groups=list(groups.values())
    )

@router.get("/{user_id}", response_model=list[MealLogResponse])
def get_user_logs(user_id: int, db: Session = Depends(get_db)):
    """Vrátí celý deníček (historii) konkrétního uživatele."""
    return crud.meal_log.get_user_logs(db, user_id)

# Úprava existujícího záznamu
@router.put("/{log_id}", response_model=MealLogResponse)
def update_meal_log(log_id: int, log_data: MealLogUpdate, db: Session = Depends(get_db)):
    """Upraví existující záznam v deníčku."""
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
