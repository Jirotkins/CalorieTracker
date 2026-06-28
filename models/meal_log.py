from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class MealLog(Base):
    __tablename__ = "meal_log"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    food_id: Mapped[int | None] = mapped_column(ForeignKey("food.id"), nullable=True)
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id"), nullable=True)
    
    date_consumed: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    meal_type: Mapped[str] = mapped_column(String) 
    amount_grams: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user = relationship("User", back_populates="meal_logs")
    food = relationship("Food")
    recipe = relationship("Recipe")
