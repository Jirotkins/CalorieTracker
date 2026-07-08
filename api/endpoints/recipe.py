from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import SessionLocal
import crud.recipe
from schemas.recipe import RecipeCreate, RecipeUpdate, RecipeResponse
from api.deps import get_current_user
from models.user import User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RecipeResponse)
def create_recipe(recipe_data: RecipeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vytvoří nový recept pod přihlášeným uživatelem."""
    recipe = crud.recipe.create_recipe(session=db, user_id=current_user.id, recipe_data=recipe_data)
    return recipe

@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Vrátí konkrétní recept podle ID."""
    recipe = crud.recipe.get_recipe(session=db, recipe_id=recipe_id)
    if not recipe or recipe.is_deleted:
        raise HTTPException(status_code=404, detail="Recept nenalezen nebo byl smazán")
    return recipe

@router.get("/", response_model=list[RecipeResponse])
def get_my_recipes(search: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Vrátí všechny recepty patřící aktuálně přihlášenému uživateli."""
    return crud.recipe.get_user_recipes(session=db, user_id=current_user.id, search=search)

@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(recipe_id: int, recipe_data: RecipeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Upraví existující recept."""
    recipe = crud.recipe.update_recipe(session=db, recipe_id=recipe_id, recipe_data=recipe_data)
    if not recipe or recipe.is_deleted:
        raise HTTPException(status_code=404, detail="Recept nenalezen nebo byl smazán")
    return recipe

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Smaže recept z databáze (Soft delete)."""
    success = crud.recipe.delete_recipe(session=db, recipe_id=recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recept nenalezen")
    return {"message": "Recept byl úspěšně smazán"}
