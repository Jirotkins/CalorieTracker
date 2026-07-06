from sqlalchemy import Integer, String, ForeignKey, Float, Boolean
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
    
    calories_per_100g: Mapped[int] = mapped_column(Integer)
    fat_per_100g: Mapped[float] = mapped_column(Float)
    saturates_per_100g: Mapped[float] = mapped_column(Float)
    carbs_per_100g: Mapped[float] = mapped_column(Float)
    sugar_per_100g: Mapped[float] = mapped_column(Float)
    protein_per_100g: Mapped[float] = mapped_column(Float)
    salt_per_100g: Mapped[float] = mapped_column(Float)

    is_deleted: Mapped[bool] = mapped_column(Boolean,default=False)
    
    user = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", cascade="all, delete-orphan")
    portions = relationship("RecipePortion", back_populates="recipe", cascade="all, delete-orphan")

class RecipePortion(Base):
    __tablename__ = "recipe_portions"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"))
    
    name: Mapped[str] = mapped_column(String)  # Např. "kousek", "talíř"
    weight_grams: Mapped[int] = mapped_column(Integer)  # Reálná váha porce
    
    recipe = relationship("Recipe", back_populates="portions")
