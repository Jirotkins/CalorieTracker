from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import SessionLocal
import crud.food
from schemas.food import FoodCreate, FoodResponse, FoodUpdate

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
def get_global_catalog(search: str | None = None, db: Session = Depends(get_db)):
    """Vrátí všechna jídla z globálního katalogu."""
    return crud.food.get_global_catalog(db, search=search)

# Metoda PUT k úpravě existujících dat
@router.put("/{food_id}", response_model=FoodResponse)
def update_food(food_id: int, food_data: FoodUpdate, db: Session = Depends(get_db)):
    """Upraví existující jídlo v katalogu."""
    
    # Pošle jen upravená data od uživatele
    update_data = food_data.model_dump(exclude_unset=True)
    
    updated_food = crud.food.update_food(db, food_id, **update_data)
    if not updated_food:
        raise HTTPException(status_code=404, detail="Jídlo nebylo nalezeno")
        
    return updated_food


# Metoda DELETE na smazání dat
@router.delete("/{food_id}")
def delete_food(food_id: int, db: Session = Depends(get_db)):
    """Smaže jídlo z databáze."""
    success = crud.food.delete_food(db, food_id)
    if not success:
        raise HTTPException(status_code=404, detail="Jídlo nebylo nalezeno")
        
    return {"message": "Jídlo úspěšně smazáno"}
