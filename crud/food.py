from sqlalchemy import select
from sqlalchemy.orm import Session
from models.food import Food, Store

def get_store_by_name(session: Session, name: str) -> Store | None:
    """Najde obchod podle jeho jména."""
    query = select(Store).where(Store.name == name)
    return session.scalar(query)

def get_food(session: Session, food_id: int) -> Food | None:
    """Najde jídlo podle jeho ID."""
    # session.get() je zkratka pro vyhledávání přímo přes Primary Key (id)
    return session.get(Food, food_id)

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
    store_names: list[str] = []
    ) -> Food:
    """Vytvoří nové jídlo a rovnou ho propojí s obchody (M:N vztah)."""
    new_food = Food(
        name=name,
        user_id=user_id,
        barcode=barcode,
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

    session.add(new_food)
    session.commit()
    session.refresh(new_food)
    return new_food
    
def get_global_catalog(session: Session) -> list[Food]:
    """Vrátí všechna jídla, která nemají majitele (tzn. globální databáze)."""
    query = select(Food).where(Food.user_id == None, Food.is_deleted == False)
    # Metoda .all() místo jednoho prvku vrátí celý seznam výsledků
    return list(session.scalars(query).all())

def update_food(session: Session, food_id: int, **kwargs) -> Food | None:
    """Upraví hodnoty jídla. Předá jen to, co chce změnit."""
    food = get_food(session, food_id)
    if not food:
        return None
        
    # Projde všechny předané argumenty a nastaví je objektu
    for key, value in kwargs.items():
        setattr(food, key, value)
        
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
