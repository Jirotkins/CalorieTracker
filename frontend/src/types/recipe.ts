import { type Food, type FoodPortion } from "./food";

// Ingredience receptu (odpovídá RecipeIngredientResponse z backendu)
export interface RecipeIngredient {
    id: number;
    food_id: number;
    amount_grams: number;
    food: Food;
}

export interface Recipe {
    id: number;
    name: string;
    photo_url?: string | null;
    // Váha hotového jídla (po uvaření); null = součet vah ingrediencí
    final_weight_grams: number | null;
    calories_per_100g: number;
    fat_per_100g: number;
    saturates_per_100g: number;
    carbs_per_100g: number;
    sugar_per_100g: number;
    protein_per_100g: number;
    salt_per_100g: number;

    ingredients: RecipeIngredient[];
    // Porce receptu mají stejný tvar jako porce jídla
    portions: FoodPortion[];
}
