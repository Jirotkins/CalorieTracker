from pydantic import BaseModel, ConfigDict
from typing import Optional
from .portion import PortionCreate, PortionResponse

class FoodCreate(BaseModel):
    name: str
    calories_per_100g: int
    fat_per_100g: float
    saturates_per_100g: float
    carbs_per_100g: float
    sugar_per_100g: float
    protein_per_100g: float
    salt_per_100g: float
    photo_url: Optional[str] = None
    barcode: Optional[str] = None
    store_names: list[str] = []
    portions: list[PortionCreate] = []

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
    photo_url: Optional[str]
    stores: list[StoreResponse] = []
    portions: list[PortionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class FoodUpdate(BaseModel):
    # Vše je volitelné. Uživatel pošle jen to, co chce reálně změnit.
    name: Optional[str] = None
    calories_per_100g: Optional[int] = None
    fat_per_100g: Optional[float] = None
    saturates_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    sugar_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    salt_per_100g: Optional[float] = None
    photo_url: Optional[str] = None
