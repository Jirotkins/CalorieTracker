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

class MealLogUpdate(BaseModel):
    meal_type: Optional[str] = None
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    amount_grams: Optional[int] = None
    date_consumed: Optional[datetime] = None

class DailySummary(BaseModel):
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    total_saturates: float
    total_sugar: float
    total_salt: float
    
    goal_calories: int
    goal_protein: float
    goal_carbs: float
    goal_fat: float
    goal_saturates: float
    goal_sugar: float
    goal_salt: float
    
    # Seznam záznamů, co dnes snědl
    logs: list[MealLogResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
