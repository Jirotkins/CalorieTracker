
// === Reálné typy z API ===

// Jedno jídlo v logu (odpovídá LogItemResponse z backendu)
export interface LogItemResponse {
    id: number;
    food_name: string | null;
    recipe_name?: string | null;
    amount_grams: number;
    calories: number;
    fat: number;
    saturates: number;
    carbs: number;
    sugar: number;
    protein: number;
    salt: number;
    portion_name: string | null;
}

// Jedna kategorie jídel (breakfast, lunch...) s celkovými makry
export interface MealGroupSummary {
    meal_type: string;
    total_calories: number;
    total_fat: number;
    total_saturates: number;
    total_carbs: number;
    total_sugar: number;
    total_protein: number;
    total_salt: number;
    items: LogItemResponse[];
}

// Celá odpověď z GET /logs/date/{date}
export interface DailySummary {
    total_calories: number;
    total_fat: number;
    total_saturates: number;
    total_carbs: number;
    total_sugar: number;
    total_protein: number;
    total_salt: number;
    goal_calories: number;
    goal_fat: number;
    goal_saturates: number;
    goal_carbs: number;
    goal_sugar: number;
    goal_protein: number;
    goal_salt: number;
    meal_groups: MealGroupSummary[];
}
