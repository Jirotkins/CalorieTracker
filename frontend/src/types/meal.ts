// Datový typ pro jedno konkrétní snědené jídlo
export interface LoggedFoodItem {
    id: number;
    name: string;
    grams: number;
    calories: number;
}

// Datový typ pro celou kategorii a její jídla
export interface MealCategoryData {
    name: string;
    items: LoggedFoodItem[];
}

// Mock data
export const MOCK_DAILY_MEALS: MealCategoryData[] = [
    { 
        name: "Snídaně", 
        items: [
            { id: 1, name: "Ovesná kaše s proteinem a ovocem", grams: 65, calories: 250 },
            { id: 2, name: "Arašídové máslo 100%", grams: 15, calories: 95 }
        ]
    },
    { 
        name: "Dopolední svačina", 
        items: [] 
    },
    { 
        name: "Oběd", 
        items: [
            { id: 3, name: "Hovězí burger s bulkou", grams: 300, calories: 1048 },
            { id: 4, name: "Coca Cola Zero", grams: 330, calories: 0 }
        ]
    },
    { 
        name: "Odpolední svačina", 
        items: [
            { id: 5, name: "Mochi salted caramel royal family", grams: 24, calories: 99 }
        ]
    },
    { 
        name: "Večeře", 
        items: [] 
    }
];