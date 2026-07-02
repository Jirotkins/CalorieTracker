from pydantic import BaseModel, ConfigDict
from typing import Optional

class FoodCreate(BaseModel):
    name: str
    calories_per_100g: int
    fat_per_100g: float
    saturates_per_100g: float
    carbs_per_100g: float
    sugar_per_100g: float
    protein_per_100g: float
    salt_per_100g: float
    barcode: Optional[str] = None
    store_names: list[str] = []

# Schéma pro Obchod
class StoreResponse(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)

class FoodResponse(BaseModel):
    id: int
    name: str
    user_id: Optional[int]
    barcode: Optional[str]
    calories_per_100g: int
    fat_per_100g: float
    saturates_per_100g: float
    carbs_per_100g: float
    sugar_per_100g: float
    protein_per_100g: float
    salt_per_100g: float
    stores: list[StoreResponse] = []

    model_config = ConfigDict(from_attributes=True)
