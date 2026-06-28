from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"))
    food_id: Mapped[int] = mapped_column(ForeignKey("food.id"))
    amount_grams: Mapped[int] = mapped_column(Integer)
    
    # Propojení ingredience přímo na konkrétní jídlo z katalogu
    food = relationship("Food")

class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    
    user = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", cascade="all, delete-orphan")
