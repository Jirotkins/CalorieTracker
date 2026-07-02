from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MealLogCreate(BaseModel):
    meal_type: str
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    amount_grams: Optional[int] = None
    date_consumed: Optional[datetime] = None

class MealLogResponse(BaseModel):
    id: int
    user_id: int
    food_id: Optional[int]
    recipe_id: Optional[int]
    meal_type: str
    amount_grams: Optional[int]
    date_consumed: datetime

    model_config = ConfigDict(from_attributes=True)
