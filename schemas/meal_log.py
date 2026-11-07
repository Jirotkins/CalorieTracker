from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime, date

# Povolené typy jídel dne (stejné pořadí jako v UI)
MealType = Literal["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]

class MealLogCreate(BaseModel):
    meal_type: MealType
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    amount_grams: Optional[int] = None
    date_consumed: Optional[datetime] = None
    portion_id: Optional[int] = None
    recipe_portion_id: Optional[int] = None

class MealLogResponse(BaseModel):
    id: int
    user_id: int
    food_id: Optional[int]
    recipe_id: Optional[int]
    meal_type: str
    amount_grams: Optional[int]
    portion_id: Optional[int]
    recipe_portion_id: Optional[int]
    date_consumed: datetime

    model_config = ConfigDict(from_attributes=True)

class MealLogUpdate(BaseModel):
    meal_type: Optional[MealType] = None
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    amount_grams: Optional[int] = None
    date_consumed: Optional[datetime] = None
    portion_id: Optional[int] = None
    recipe_portion_id: Optional[int] = None

class LogItemResponse(BaseModel):
    id: int
    meal_type: str
    # ID pro editaci záznamu na frontendu
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    portion_id: Optional[int] = None
    recipe_portion_id: Optional[int] = None
    amount_grams: int
    calories: int
    fat: float
    saturates: float
    carbs: float
    sugar: float
    protein: float
    salt: float
    food_name: Optional[str] = None
    recipe_name: Optional[str] = None
    portion_name: Optional[str] = None
    # Kolik porcí odpovídá amount_grams (např. 1.5 = "1,5× kus")
    portion_count: Optional[float] = None

class MealGroupSummary(BaseModel):
    meal_type: str
    total_calories: int = 0
    total_fat: float = 0.0
    total_saturates: float = 0.0
    total_carbs: float = 0.0
    total_sugar: float = 0.0
    total_protein: float = 0.0
    total_salt: float = 0.0

    items: list[LogItemResponse] = []

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
    
    # Seznam záznamů (celých bloků podle typu jídla - "snídaně/oběd")
    meal_groups: list[MealGroupSummary] = []

    model_config = ConfigDict(from_attributes=True)

# Součty jednoho dne pro statistiky
class DayStats(BaseModel):
    day: date
    # Počet záznamů v deníčku (0 = den bez zápisu → nezapočítává se do průměrů)
    log_count: int = 0
    calories: int = 0
    fat: float = 0.0
    saturates: float = 0.0
    carbs: float = 0.0
    sugar: float = 0.0
    protein: float = 0.0
    salt: float = 0.0

# Odpověď GET /logs/stats — každý den v rozsahu (i prázdný) + aktuální cíle
class StatsResponse(BaseModel):
    start: date
    end: date

    goal_calories: int
    goal_protein: float
    goal_carbs: float
    goal_fat: float
    goal_saturates: float
    goal_sugar: float
    goal_salt: float

    days: list[DayStats] = []