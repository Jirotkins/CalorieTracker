export interface Store {
    id: number;
    name: string;
}

export interface FoodPortion {
    id: number;
    food_id: number;
    name: string;
    weight_grams: number;
}

export interface Food {
    id: number;
    name: string;
    user_id?: number | null;
    barcode?: string | null;
    calories_per_100g: number;
    fat_per_100g: number;
    saturates_per_100g: number;
    carbs_per_100g: number;
    sugar_per_100g: number;
    protein_per_100g: number;
    salt_per_100g: number;
    photo_url?: string | null;

    // Obchody a porce
    stores: Store[];
    portions: FoodPortion[];
}
