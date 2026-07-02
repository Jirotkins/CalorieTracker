from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import SessionLocal
import crud.food
from schemas.food import FoodCreate, FoodResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Metoda POST pro vytvoření jídla
@router.post("/", response_model=FoodResponse)
def create_food(food_data: FoodCreate, db: Session = Depends(get_db)):
    """Vytvoří nové jídlo v katalogu."""
    new_food = crud.food.create_food(
        session=db,
        name=food_data.name,
        calories_per_100g=food_data.calories_per_100g,
        fat_per_100g=food_data.fat_per_100g,
        saturates_per_100g=food_data.saturates_per_100g,
        carbs_per_100g=food_data.carbs_per_100g,
        sugar_per_100g=food_data.sugar_per_100g,
        protein_per_100g=food_data.protein_per_100g,
        salt_per_100g=food_data.salt_per_100g,
        barcode=food_data.barcode,
        store_names=food_data.store_names
    )
    return new_food

# Metoda GET pro získání všech jídel
@router.get("/", response_model=list[FoodResponse])
def get_global_catalog(db: Session = Depends(get_db)):
    """Vrátí všechna jídla z globálního katalogu."""
    return crud.food.get_global_catalog(db)
