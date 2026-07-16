
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

// Mock data prozatím
export const MOCK_DAILY_NUTRITION:
    DailyNutrition = {
    calories: { consumed: 1250, goal: 2400 },
    fats: { consumed: 85, goal: 70 },
    saturates: { consumed: 15, goal: 10 },
    carbs: { consumed: 200, goal: 250 },
    sugar: { consumed: 50, goal: 50 },
    protein: { consumed: 110, goal: 150 },
    salt: { consumed: 3.6, goal: 5.2 }
}