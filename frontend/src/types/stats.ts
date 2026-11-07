// Součty jednoho dne (odpovídá DayStats z backendu)
export interface DayStats {
    day: string; // "YYYY-MM-DD"
    // 0 = den bez zápisu → nezapočítává se do průměrů
    log_count: number;
    calories: number;
    fat: number;
    saturates: number;
    carbs: number;
    sugar: number;
    protein: number;
    salt: number;
}

// Celá odpověď z GET /logs/stats
export interface StatsResponse {
    start: string;
    end: string;
    goal_calories: number;
    goal_fat: number;
    goal_saturates: number;
    goal_carbs: number;
    goal_sugar: number;
    goal_protein: number;
    goal_salt: number;
    days: DayStats[];
}
