from pydantic import BaseModel, ConfigDict
from typing import Optional
from .portion import PortionCreate, PortionResponse

class RecipeIngredientCreate(BaseModel):
    amount_grams: int
    food_id: Optional[int] = None

class RecipeCreate(BaseModel):
    name: str
    photo_url: Optional[str]
    final_weight_grams: Optional[int]
    ingredients: list[RecipeIngredientCreate]
    portions: list[PortionCreate] = []

class RecipeIngredientResponse(BaseModel):
    id: int
    food_id: int
    amount_grams: int
    
    model_config = ConfigDict(from_attributes=True)

class RecipeResponse(BaseModel):
    id: int
    name: str
    photo_url: Optional[str]
    calories_per_100g: int
    fat_per_100g: float
    saturates_per_100g: float
    carbs_per_100g: float
    sugar_per_100g: float
    protein_per_100g: float
    salt_per_100g: float
    ingredients: list[RecipeIngredientResponse] = []
    portions: list[PortionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class RecipeUpdate(BaseModel):
    # Vše je volitelné. Uživatel pošle jen to, co chce reálně změnit.
    name: Optional[str] = None
    photo_url: Optional[str] = None
    final_weight_grams: Optional[int] = None
    ingredients: Optional[list[RecipeIngredientCreate]] = None