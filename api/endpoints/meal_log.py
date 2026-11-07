from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import get_args

from core.database import SessionLocal
import crud.meal_log
from schemas.meal_log import MealLogCreate, MealLogResponse, MealLogUpdate, DailySummary, MealGroupSummary, LogItemResponse, MealType, DayStats, StatsResponse
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

def _resolve_log(log):
    """Zjistí zdroj (jídlo/recept), gramy a porci záznamu. Vrátí None pro záznam bez zdroje."""
    # Záznam je buď jídlo, nebo recept (každý s vlastním typem porce)
    if log.food:
        source, portion = log.food, log.portion
    elif log.recipe:
        source, portion = log.recipe, log.recipe_portion
    else:
        return None

    # Uložené gramy mají přednost (např. 1,5 porce); váha porce je jen záloha pro staré záznamy
    if portion:
        grams = log.amount_grams or portion.weight_grams
        portion_count = round(grams / portion.weight_grams, 2) if portion.weight_grams else None
        return source, grams, portion.name, portion_count

    return source, log.amount_grams or 100, None, None

def _user_goals(user: User) -> dict:
    """Denní cíle uživatele ve tvaru goal_* (pro denní souhrn i statistiky)."""
    return {
        "goal_calories": user.daily_calories_goal,
        "goal_fat": user.daily_fat_goal,
        "goal_saturates": user.daily_saturates_goal,
        "goal_carbs": user.daily_carbs_goal,
        "goal_sugar": user.daily_sugar_goal,
        "goal_protein": user.daily_protein_goal,
        "goal_salt": user.daily_salt_goal,
    }

@router.get("/date/{target_date}", response_model=DailySummary)
def get_user_logs_by_date(target_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vrátí deníček pro konkrétní den (uživatel posílá formát YYYY-MM-DD)."""

    logs = crud.meal_log.get_logs_by_date(db, current_user.id, target_date)
    groups = {meal_type: MealGroupSummary(meal_type=meal_type) for meal_type in get_args(MealType)}

    for log in logs:
        resolved = _resolve_log(log)
        if not resolved:
            continue
        source, grams, portion_name, portion_count = resolved

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
            portion_count=portion_count,
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
        **_user_goals(current_user),
        meal_groups=list(groups.values())
    )

# Maximální rozsah statistik (cca rok), aby šel dotaz rychle
MAX_STATS_DAYS = 366

# POZOR: Musí být PŘED /{user_id}! Jinak by "stats" zachytil jako integer user_id.
@router.get("/stats", response_model=StatsResponse)
def get_stats(start: date, end: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vrátí denní součty maker pro rozsah dní (formát YYYY-MM-DD, včetně obou krajů)."""
    day_count = (end - start).days + 1
    if day_count < 1:
        raise HTTPException(status_code=400, detail="Konec rozsahu musí být stejný nebo pozdější než začátek.")
    if day_count > MAX_STATS_DAYS:
        raise HTTPException(status_code=400, detail=f"Rozsah může mít maximálně {MAX_STATS_DAYS} dní.")

    # Každý den rozsahu (i bez záznamu), aby graf neměl díry
    days = {start + timedelta(days=i): DayStats(day=start + timedelta(days=i)) for i in range(day_count)}

    for log in crud.meal_log.get_logs_in_range(db, current_user.id, start, end):
        resolved = _resolve_log(log)
        day = days.get(log.date_consumed.date())
        if not resolved or day is None:
            continue

        source, grams, _, _ = resolved
        for key, value in _nutrients_for(source, grams).items():
            setattr(day, key, getattr(day, key) + value)
        day.log_count += 1

    return StatsResponse(start=start, end=end, **_user_goals(current_user), days=list(days.values()))

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
