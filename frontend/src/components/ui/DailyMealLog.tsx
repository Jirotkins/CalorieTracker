import { Coffee, Apple, Utensils, Croissant, Moon } from "lucide-react";
import { MealSection } from "./MealSection";
import { FoodLogItem } from "./FoodLogItem";
import { type MealGroupSummary } from "../../types/meal";

// Překlad API klíčů na česky
const MEAL_LABELS: Record<string, string> = {
    breakfast: "Snídaně",
    morning_snack: "Dopolední svačina",
    lunch: "Oběd",
    afternoon_snack: "Odpolední svačina",
    dinner: "Večeře",
}

function getIconForMealType(mealType: string) {
    switch (mealType) {
        case "breakfast": return <Coffee size={22} />;
        case "morning_snack": return <Apple size={22} />;
        case "lunch": return <Utensils size={22} />;
        case "afternoon_snack": return <Croissant size={22} />;
        case "dinner": return <Moon size={22} />;
        default: return <Utensils size={22} />;
    }
}

interface DailyMealLogProps {
    mealsData: MealGroupSummary[];
}

export function DailyMealLog({ mealsData }: DailyMealLogProps) {
    return (
        <div className="flex flex-col gap-4">
            {mealsData.map((group) => (
                <MealSection
                    key={group.meal_type}
                    title={MEAL_LABELS[group.meal_type] ?? group.meal_type}
                    icon={getIconForMealType(group.meal_type)}
                    totalCalories={group.total_calories}
                >
                    {group.items.length > 0 && (
                        <div className="flex flex-col border-t border-slate-100 dark:border-slate-800">
                            {group.items.map(item => (
                                <FoodLogItem
                                    key={item.id}
                                    name={item.food_name ?? item.recipe_name ?? "Neznámé jídlo"}
                                    grams={item.amount_grams}
                                    calories={item.calories}
                                    onClickInfo={() => console.log(`Info: ${item.food_name}`)}
                                />
                            ))}
                        </div>
                    )}
                </MealSection>
            ))}
        </div>
    );
}