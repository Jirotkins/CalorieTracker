
// Rozhraní pro jedno konrétní makro
export interface MacroGoal {
    consumed: number;
    goal: number;
}

// Objekt celého dne
export interface DailyNutrition {
    calories: MacroGoal;
    fats: MacroGoal;
    saturates: MacroGoal;
    carbs: MacroGoal;
    sugar: MacroGoal;
    protein: MacroGoal;
    salt: MacroGoal;
}
