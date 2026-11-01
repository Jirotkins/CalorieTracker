from sqlalchemy import select, update
from sqlalchemy.orm import Session
from models.food import Food, Store, FoodPortion
from models.meal_log import MealLog
from schemas.portion import PortionCreate, PortionUpdate

def get_store_by_name(session: Session, name: str) -> Store | None:
    """Najde obchod podle jeho jména."""
    query = select(Store).where(Store.name == name)
    return session.scalar(query)

def get_food(session: Session, food_id: int) -> Food | None:
    """Najde jídlo podle jeho ID."""
    query = select(Food).where(Food.id == food_id, Food.is_deleted == False)
    return session.scalar(query)

def create_store(session: Session, name: str) -> Store:
    """Vytvoří nový obchod (např. 'Lidl'), nebo vrátí existující."""
    existing = get_store_by_name(session, name)
    if existing:
        return existing

    new_store = Store(name=name)
    session.add(new_store)
    session.commit()
    session.refresh(new_store)
    return new_store

def create_food(
    session: Session,
    name: str,
    calories_per_100g: int,
    fat_per_100g: float,
    saturates_per_100g: float,
    carbs_per_100g: float,
    sugar_per_100g: float,
    protein_per_100g: float,
    salt_per_100g: float,
    user_id: int | None = None,
    barcode: str | None = None,
    photo_url: str | None = None,
    store_names: list[str] = [],
    portions: list[PortionCreate] = []
    ) -> Food:
    """Vytvoří nové jídlo a rovnou ho propojí s obchody (M:N vztah)."""
    new_food = Food(
        name=name,
        user_id=user_id,
        barcode=barcode,
        photo_url=photo_url,
        calories_per_100g=calories_per_100g,
        fat_per_100g=fat_per_100g,
        saturates_per_100g=saturates_per_100g,
        carbs_per_100g=carbs_per_100g,
        sugar_per_100g=sugar_per_100g,
        protein_per_100g=protein_per_100g,
        salt_per_100g=salt_per_100g
    )

    for store_name in store_names:
        store = create_store(session, store_name)
        new_food.stores.append(store)

    for portion_data in portions:
        new_food.portions.append(FoodPortion(name=portion_data.name, weight_grams=portion_data.weight_grams))

    session.add(new_food)
    session.commit()
    session.refresh(new_food)
    return new_food
    
def get_global_catalog(session: Session, search: str | None = None) -> list[Food]:
    """Vrátí všechna jídla, která nemají majitele (tzn. globální databáze)."""
    query = select(Food).where(Food.user_id == None, Food.is_deleted == False)

    if search:
        query = query.where(Food.name.ilike(f"%{search}%"))
    # Metoda .all() místo jednoho prvku vrátí celý seznam výsledků
    return list(session.scalars(query).all())

def get_user_food(session: Session, user_id: int, search: str | None = None) -> list[Food]:
    """Vrátí všechna jídla konkrétního uživatele, které nejsou v glob. katalogu."""
    query = select(Food).where(Food.user_id == user_id, Food.is_deleted == False)

    if search:
        query = query.where(Food.name.ilike(f"%{search}%"))
    return list(session.scalars(query).all())

def set_food_portions(session: Session, food: Food, portions: list[PortionUpdate]) -> None:
    """Synchronizuje porce jídla: existující (s id) upraví, nové vytvoří, chybějící smaže."""
    existing = {portion.id: portion for portion in food.portions}
    kept_ids = set()

    for portion_data in portions:
        portion = existing.get(portion_data.id) if portion_data.id is not None else None
        if portion:
            portion.name = portion_data.name
            portion.weight_grams = portion_data.weight_grams
            kept_ids.add(portion.id)
        else:
            food.portions.append(FoodPortion(name=portion_data.name, weight_grams=portion_data.weight_grams))

    for portion_id, portion in existing.items():
        if portion_id in kept_ids:
            continue
        # Záznamy v deníčku mají gramy uložené v amount_grams, přijdou jen o název porce
        session.execute(update(MealLog).where(MealLog.portion_id == portion_id).values(portion_id=None))
        food.portions.remove(portion)  # delete-orphan cascade porci smaže

def update_food(session: Session, food_id: int, portions: list[PortionUpdate] | None = None, **kwargs) -> Food | None:
    """Upraví hodnoty jídla. Předá jen to, co chce změnit."""
    food = get_food(session, food_id)
    if not food:
        return None
        
    # Projde všechny předané argumenty a nastaví je objektu
    for key, value in kwargs.items():
        setattr(food, key, value)

    if portions is not None:
        set_food_portions(session, food, portions)
        
    session.commit()
    session.refresh(food)
    return food

def delete_food(session: Session, food_id: int) -> bool:
    """Smaže jídlo z databáze (Soft delete)."""
    food = session.get(Food, food_id) # Zkratka pro hledání podle ID
    if not food:
        return False
        
    food.is_deleted = True
    session.commit()
    return True

def get_food_by_barcode(session: Session, barcode: str) -> Food | None:
    """Najde jídlo v naší databázi podle čárového kódu."""
    query = select(Food).where(Food.barcode == barcode, Food.is_deleted == False)
    return session.scalar(query)
