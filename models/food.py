from sqlalchemy import Integer, String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

# Propojovací tabulka pro M:N vztah (Jídlo <-> Obchod)
class FoodStore(Base):
    __tablename__ = "food_stores"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    food_id: Mapped[int] = mapped_column(ForeignKey("food.id"))
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))

class Store(Base):
    __tablename__ = "stores"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)

class Food(Base):
    __tablename__ = "food"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Pokud je vyplněno, je to soukromé jídlo uživatele
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    name: Mapped[str] = mapped_column(String, index=True)
    barcode: Mapped[str | None] = mapped_column(String, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    
    calories_per_100g: Mapped[int] = mapped_column(Integer)
    fat_per_100g: Mapped[float] = mapped_column(Float)
    saturates_per_100g: Mapped[float] = mapped_column(Float)
    carbs_per_100g: Mapped[float] = mapped_column(Float)
    sugar_per_100g: Mapped[float] = mapped_column(Float)
    protein_per_100g: Mapped[float] = mapped_column(Float)
    salt_per_100g: Mapped[float] = mapped_column(Float)

    # Vztahy
    user = relationship("User", back_populates="custom_foods")
    # Díky atributu 'secondary' budeme moci snadno číst: jablko.stores
    stores = relationship("Store", secondary="food_stores")
    portions = relationship("FoodPortion", back_populates="food", cascade="all, delete-orphan")


class FoodPortion(Base):
    __tablename__ = "food_portions"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    food_id: Mapped[int] = mapped_column(ForeignKey("food.id"))
    
    name: Mapped[str] = mapped_column(String)  # Např. "balení", "kus"
    weight_grams: Mapped[int] = mapped_column(Integer)  # Reálná váha v (g)
    
    food = relationship("Food", back_populates="portions")
