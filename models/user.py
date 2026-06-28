from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    
    daily_calories_goal: Mapped[int] = mapped_column(Integer)
    daily_fat_goal: Mapped[float] = mapped_column(Float)
    daily_saturates_goal: Mapped[float] = mapped_column(Float)
    daily_carbs_goal: Mapped[float] = mapped_column(Float)
    daily_sugar_goal: Mapped[float] = mapped_column(Float)
    daily_protein_goal: Mapped[float] = mapped_column(Float)
    daily_salt_goal: Mapped[float] = mapped_column(Float)

    # Zpětné vztahy (co všechno uživateli patří)
    meal_logs = relationship("MealLog", back_populates="user", cascade="all, delete-orphan")
    recipes = relationship("Recipe", back_populates="user", cascade="all, delete-orphan")
    custom_foods = relationship("Food", back_populates="user")
