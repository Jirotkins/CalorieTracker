from sqlalchemy import select
from sqlalchemy.orm import Session
from models.recipe import Recipe, RecipeIngredient, RecipePortion
from models.food import Food
from models.meal_log import MealLog
from schemas.recipe import RecipeCreate, RecipeUpdate, RecipeIngredientCreate
from crud.portion import sync_portions

# Klíče maker (odpovídají polím *_per_100g ve Food a Recipe)
NUTRIENT_KEYS = ("calories", "fat", "saturates", "carbs", "sugar", "protein", "salt")

def get_recipe(session: Session, recipe_id: int) -> Recipe | None:
    """Vrátí konkrétní recept podle ID."""
    return session.get(Recipe, recipe_id)

def get_user_recipes(session: Session, user_id: int, search: str | None = None) -> list[Recipe]:
    """Vrátí všechny recepty patřící konkrétnímu uživateli (bez smazaných)."""
    query = select(Recipe).where(Recipe.user_id==user_id, Recipe.is_deleted==False)
    if search:
        query = query.where(Recipe.name.ilike(f"%{search}%"))
    return list(session.scalars(query).all())

def _replace_ingredients(session: Session, recipe: Recipe, ingredients: list[RecipeIngredientCreate]) -> None:
    """Nahradí ingredience receptu novým seznamem (neexistující jídla přeskočí)."""
    # Staré vazby smaže delete-orphan cascade
    recipe.ingredients.clear()

    for ing_data in ingredients:
        food = session.get(Food, ing_data.food_id)
        if not food:
            continue
        recipe.ingredients.append(RecipeIngredient(food=food, amount_grams=ing_data.amount_grams))

def _recalculate_macros(recipe: Recipe) -> None:
    """Spočítá makra receptu na 100 g z ingrediencí a finální váhy (po uvaření)."""
    totals = dict.fromkeys(NUTRIENT_KEYS, 0.0)
    total_weight_raw = 0

    # Sečte makra všech ingrediencí podle jejich váhy
    for ingredient in recipe.ingredients:
        total_weight_raw += ingredient.amount_grams
        multiplier = ingredient.amount_grams / 100.0
        for key in NUTRIENT_KEYS:
            totals[key] += getattr(ingredient.food, f"{key}_per_100g") * multiplier

    # Pokud jídlo po "upečení" váží jinak, přepočítá se na finální váhu
    final_weight = recipe.final_weight_grams or total_weight_raw
    ratio = 100.0 / final_weight if final_weight > 0 else 0.0

    recipe.calories_per_100g = round(totals["calories"] * ratio)
    for key in NUTRIENT_KEYS[1:]:
        setattr(recipe, f"{key}_per_100g", round(totals[key] * ratio, 2))

def create_recipe(session: Session, user_id: int, recipe_data: RecipeCreate) -> Recipe:
    """
    Vytvoří nový recept a spočítá makroživiny podle ingrediencí.
    """
    new_recipe = Recipe(
        user_id=user_id,
        name=recipe_data.name,
        photo_url=recipe_data.photo_url,
        final_weight_grams=recipe_data.final_weight_grams,
    )
    session.add(new_recipe)

    _replace_ingredients(session, new_recipe, recipe_data.ingredients)
    _recalculate_macros(new_recipe)

    # Rozdělení podle porcí
    for portion_data in recipe_data.portions:
        new_recipe.portions.append(RecipePortion(name=portion_data.name, weight_grams=portion_data.weight_grams))

    session.commit()
    session.refresh(new_recipe)

    return new_recipe

def update_recipe(session: Session, recipe_id: int, recipe_data: RecipeUpdate) -> Recipe | None:
    """Upraví existující recept. Při změně ingrediencí nebo váhy přepočítá makra."""
    recipe = get_recipe(session, recipe_id)
    if not recipe or recipe.is_deleted:
        return None

    # Změna jména nebo fotky
    if recipe_data.name is not None:
        recipe.name = recipe_data.name
    if recipe_data.photo_url is not None:
        recipe.photo_url = recipe_data.photo_url

    # Finální váhu jde i smazat (null = počítat se součtem ingrediencí)
    needs_recalculation = False
    if "final_weight_grams" in recipe_data.model_fields_set:
        recipe.final_weight_grams = recipe_data.final_weight_grams
        needs_recalculation = True

    # Ingredience se nahradí novými (přepočet zároveň zohlední aktuální makra jídel)
    if recipe_data.ingredients is not None:
        _replace_ingredients(session, recipe, recipe_data.ingredients)
        needs_recalculation = True

    if needs_recalculation:
        _recalculate_macros(recipe)

    if recipe_data.portions is not None:
        sync_portions(session, recipe.portions, recipe_data.portions, RecipePortion, MealLog.recipe_portion_id)

    session.commit()
    session.refresh(recipe)
    return recipe

def delete_recipe(session: Session, recipe_id: int) -> bool:
    """Smaže recept z databáze (Soft delete)."""
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        return False

    recipe.is_deleted = True
    session.commit()
    return True
