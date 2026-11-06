from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from .food import FoodResponse
from .portion import PortionCreate, PortionUpdate, PortionResponse

class RecipeIngredientCreate(BaseModel):
    food_id: int
    amount_grams: int = Field(gt=0)

class RecipeCreate(BaseModel):
    name: str
    photo_url: Optional[str] = None
    # Váha hotového jídla (po uvaření); bez ní se počítá se součtem vah ingrediencí
    final_weight_grams: Optional[int] = Field(default=None, gt=0)
    ingredients: list[RecipeIngredientCreate]
    portions: list[PortionCreate] = []

class RecipeIngredientResponse(BaseModel):
    id: int
    food_id: int
    amount_grams: int
    # Celé jídlo ingredience (název, fotka, makra pro přepočet na frontendu)
    food: FoodResponse

    model_config = ConfigDict(from_attributes=True)

class RecipeResponse(BaseModel):
    id: int
    name: str
    photo_url: Optional[str] = None
    final_weight_grams: Optional[int] = None
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
    final_weight_grams: Optional[int] = Field(default=None, gt=0)
    ingredients: Optional[list[RecipeIngredientCreate]] = None
    # Pokud je posláno, nahradí celý seznam porcí (chybějící porce se smažou)
    portions: Optional[list[PortionUpdate]] = None
