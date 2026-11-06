from sqlalchemy import update
from sqlalchemy.orm import Session
from models.meal_log import MealLog
from schemas.portion import PortionUpdate

def sync_portions(session: Session, current_portions: list, portions: list[PortionUpdate], portion_model, log_portion_column) -> None:
    """Synchronizuje porce jídla/receptu: existující (s id) upraví, nové vytvoří, chybějící smaže.

    current_portions: relationship se seznamem porcí (food.portions / recipe.portions)
    portion_model: FoodPortion nebo RecipePortion
    log_portion_column: sloupec v MealLog, který na porci odkazuje (portion_id / recipe_portion_id)
    """
    existing = {portion.id: portion for portion in current_portions}
    kept_ids = set()

    for portion_data in portions:
        portion = existing.get(portion_data.id) if portion_data.id is not None else None
        if portion:
            portion.name = portion_data.name
            portion.weight_grams = portion_data.weight_grams
            kept_ids.add(portion.id)
        else:
            current_portions.append(portion_model(name=portion_data.name, weight_grams=portion_data.weight_grams))

    for portion_id, portion in existing.items():
        if portion_id in kept_ids:
            continue
        # Záznamy v deníčku mají gramy uložené v amount_grams, přijdou jen o název porce
        session.execute(update(MealLog).where(log_portion_column == portion_id).values({log_portion_column: None}))
        current_portions.remove(portion)  # delete-orphan cascade porci smaže
