from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import SessionLocal
import crud.food
from schemas.food import FoodCreate, FoodResponse, FoodUpdate, BarcodeLookupResponse
from api.deps import get_current_user
from models.user import User
from services.openfoodfacts import fetch_food_from_off

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=FoodResponse)
def create_food(food_data: FoodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vytvoří nové jídlo pod aktuálně přihlášeným uživatelem."""
    target_user_id = None if food_data.is_global else current_user.id
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
        user_id=target_user_id,
        barcode=food_data.barcode,
        photo_url=food_data.photo_url,
        store_names=food_data.store_names
    )
    return new_food

# Metoda GET pro získání všech jídel
@router.get("/", response_model=list[FoodResponse])
def get_global_catalog(search: str | None = None, db: Session = Depends(get_db)):
    """Vrátí všechna jídla z globálního katalogu."""
    return crud.food.get_global_catalog(db, search=search)

# Metoda GET pro získání VLASTNÍCH jídel přihlášeného uživatele
@router.get("/me", response_model=list[FoodResponse])
def get_my_foods(search: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vrátí všechna soukromá jídla nebo recepty uživatele."""
    return crud.food.get_user_food(session=db, user_id=current_user.id, search=search)

@router.get("/{food_id}", response_model=FoodResponse)
def get_food(food_id: int, db: Session = Depends(get_db)):
    """Vrátí jídlo podle jeho ID."""
    food = crud.food.get_food(db, food_id)
    if food:
        return food
    
    raise HTTPException(status_code=404, detail="Jídlo v DB neexisuje.")

@router.get("/barcode/{barcode}", response_model=BarcodeLookupResponse)
def lookup_barcode(barcode: str, db: Session = Depends(get_db)):
    """Pokusí se najít jídlo lokálně. Pokud neexistuje, zkusí to v Open Food Facts."""
    
    # Zkusí naši lokální databázi
    local_food = crud.food.get_food_by_barcode(db, barcode)
    if local_food:
        food_response = FoodResponse.model_validate(local_food)
        return {"found_in_our_db": True, "food": food_response}
        
    # Zkusí Open Food Facts
    off_data = fetch_food_from_off(barcode)
    if off_data:
        return {"found_in_our_db": False, "food": off_data}
        
    # Neexistuje nikde
    raise HTTPException(status_code=404, detail="Jídlo nebylo nalezeno ani u nás, ani v Open Food Facts.")

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
