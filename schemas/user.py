from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

# Příchozí schéma dat od uživatele
class UserCreate(BaseModel):
    username: str
    password: str
    invite_code: str  # Tajný kód nutný pro registraci
    daily_calories_goal: Optional[int] = 2000
    daily_protein_goal: Optional[float] = 120.0
    daily_carbs_goal: Optional[float] = 250.0
    daily_fat_goal: Optional[float] = 70.0
    daily_saturates_goal: Optional[float] = 20.0
    daily_sugar_goal: Optional[float] = 50.0
    daily_salt_goal: Optional[float] = 6.0

# Úprava denních cílů — posílá se jen to, co se mění (hodnoty musí být kladné)
class UserGoalsUpdate(BaseModel):
    daily_calories_goal: Optional[int] = Field(default=None, gt=0)
    daily_protein_goal: Optional[float] = Field(default=None, gt=0)
    daily_carbs_goal: Optional[float] = Field(default=None, gt=0)
    daily_fat_goal: Optional[float] = Field(default=None, gt=0)
    daily_saturates_goal: Optional[float] = Field(default=None, gt=0)
    daily_sugar_goal: Optional[float] = Field(default=None, gt=0)
    daily_salt_goal: Optional[float] = Field(default=None, gt=0)

# Odchozí schéma dat, které jsou uživately poslány
class UserResponse(BaseModel):
    id: int
    username: str
    daily_calories_goal: int
    daily_protein_goal: float
    daily_carbs_goal: float
    daily_fat_goal: float
    daily_saturates_goal: float
    daily_sugar_goal: float
    daily_salt_goal: float

    # Propojení Pydenticu s SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
