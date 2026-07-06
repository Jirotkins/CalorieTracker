from sqlalchemy import select
from sqlalchemy.orm import Session
from models.recipe import Recipe, RecipeIngredient, RecipePortion
from models.food import Food
from schemas.recipe import RecipeCreate, RecipeUpdate

def get_recipe(session: Session, recipe_id: int) -> Recipe | None:
    """Vrátí konkrétní recept podle ID."""
    return session.get(Recipe, recipe_id)

def get_user_recipes(session: Session, user_id: int) -> list[Recipe]:
    """Vrátí všechny recepty patřící konkrétnímu uživateli (bez smazaných)."""
    query = select(Recipe).where(Recipe.user_id==user_id, Recipe.is_deleted==False)
    return list(session.scalars(query).all())

def create_recipe(session: Session, user_id: int, recipe_data: RecipeCreate) -> Recipe:
    """
    Vytvoří nový recept a spočítá makroživiny podle ingrediencí.
    """
    new_recipe = Recipe(
        user_id=user_id,
        name=recipe_data.name,
        photo_url=recipe_data.photo_url,
        calories_per_100g=0,
        fat_per_100g=0.0,
        saturates_per_100g=0.0,
        carbs_per_100g=0.0,
        sugar_per_100g=0.0,
        protein_per_100g=0.0,
        salt_per_100g=0.0
    )
    session.add(new_recipe)
    # Flush() pro získání ID nového receptu
    session.flush()

    total_weight_raw = 0
    total_cal = 0
    total_fat = 0.0
    total_sat = 0.0
    total_carb = 0.0
    total_sug = 0.0
    total_prot = 0.0
    total_salt = 0.0

    # Projde všechny ingredience od uživatele
    for ing_data in recipe_data.ingredients:
        food = session.get(Food, ing_data.food_id)
        if not food:
            continue

        # Vytvoří záznam o ingredienci (M:N)
        recipe_ing = RecipeIngredient(
            recipe_id=new_recipe.id,
            food_id=food.id,
            amount_grams=ing_data.amount_grams
        )
        session.add(recipe_ing)
        # Přičte váhy ingredience do celkové váhy
        total_weight_raw += ing_data.amount_grams
        # Spočítá makroživiny a vynásobí podle váhy ingredience
        multiplier = ing_data.amount_grams / 100.0
        total_cal += int(food.calories_per_100g * multiplier)
        total_fat += food.fat_per_100g * multiplier
        total_sat += food.saturates_per_100g * multiplier
        total_carb += food.carbs_per_100g * multiplier
        total_sug += food.sugar_per_100g * multiplier
        total_prot += food.protein_per_100g * multiplier
        total_salt += food.salt_per_100g * multiplier

    # Přepočítá finální váhu pokud po "upečení" má jídlo jinou váhu
    final_weight = recipe_data.final_weight_grams if recipe_data.final_weight_grams else total_weight_raw
    # Hodnoty na 100g jídla
    if final_weight > 0:
        ratio = 100.0 / final_weight

        new_recipe.calories_per_100g = int(total_cal * ratio)
        new_recipe.fat_per_100g = round(total_fat * ratio, 2)
        new_recipe.saturates_per_100g = round(total_sat * ratio, 2)
        new_recipe.carbs_per_100g = round(total_carb * ratio, 2)
        new_recipe.sugar_per_100g = round(total_sug * ratio, 2)
        new_recipe.protein_per_100g = round(total_prot * ratio, 2)
        new_recipe.salt_per_100g = round(total_salt * ratio, 2)

    # Rozdělení podle porcí
    for portion_data in recipe_data.portions:
        new_portion = RecipePortion(
            recipe_id=new_recipe.id,
            name=portion_data.name,
            weight_grams=portion_data.weight_grams
        )
        session.add(new_portion)

    session.commit()
    session.refresh(new_recipe)
    
    return new_recipe

def update_recipe(session: Session, recipe_id: int, recipe_data: RecipeUpdate) -> Recipe | None:
    """Upraví existující recept. Pokud přijdou nové ingredience nebo váha, musí přepočítat makra."""
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        return None

    # Změna jména nebo fotky
    if recipe_data.name is not None:
        recipe.name = recipe_data.name
    if recipe_data.photo_url is not None:
        recipe.photo_url = recipe_data.photo_url

    # Staré ingredience se musí smazat a nahradit novými
    if recipe_data.ingredients is not None:
        # Vymaže staré vazby z databáze
        for old_ing in recipe.ingredients:
            session.delete(old_ing)
        
        session.flush()

        total_weight_raw = 0
        total_cal = 0
        total_fat = 0.0
        total_sat = 0.0
        total_carb = 0.0
        total_sug = 0.0
        total_prot = 0.0
        total_salt = 0.0

        for ing_data in recipe_data.ingredients:
            food = session.get(Food, ing_data.food_id)
            if not food:
                continue

            # Přidá novou ingredienci
            recipe_ing = RecipeIngredient(
                recipe_id=recipe.id,
                food_id=food.id,
                amount_grams=ing_data.amount_grams
            )
            session.add(recipe_ing)
            
            total_weight_raw += ing_data.amount_grams
            multiplier = ing_data.amount_grams / 100.0
            
            total_cal += int(food.calories_per_100g * multiplier)
            total_fat += food.fat_per_100g * multiplier
            total_sat += food.saturates_per_100g * multiplier
            total_carb += food.carbs_per_100g * multiplier
            total_sug += food.sugar_per_100g * multiplier
            total_prot += food.protein_per_100g * multiplier
            total_salt += food.salt_per_100g * multiplier

        # Určí finální váhu
        final_weight = recipe_data.final_weight_grams if recipe_data.final_weight_grams else total_weight_raw
        
        # Znovu naplní makra u receptu
        if final_weight > 0:
            ratio = 100.0 / final_weight
            recipe.calories_per_100g = int(total_cal * ratio)
            recipe.fat_per_100g = round(total_fat * ratio, 2)
            recipe.saturates_per_100g = round(total_sat * ratio, 2)
            recipe.carbs_per_100g = round(total_carb * ratio, 2)
            recipe.sugar_per_100g = round(total_sug * ratio, 2)
            recipe.protein_per_100g = round(total_prot * ratio, 2)
            recipe.salt_per_100g = round(total_salt * ratio, 2)

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
