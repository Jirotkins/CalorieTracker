import { useState } from "react";
import { Coffee, Apple, Utensils, Croissant, Moon } from "lucide-react";
import { MealSection } from "./MealSection";
import { FoodLogItem } from "./FoodLogItem";
import { SearchFoodSheet } from "./SearchFoodSheet";
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
    selectedDate: Date;
    onLogAdded: () => void;
}

export function DailyMealLog({ mealsData, selectedDate, onLogAdded }: DailyMealLogProps) {
    // null = sheet zavřen; string = sheet otevřen pro daný meal_type
    const [activeMealType, setActiveMealType] = useState<string | null>(null);

    return (
        <>
            <div className="flex flex-col gap-4">
                {mealsData.map((group) => (
                    <MealSection
                        key={group.meal_type}
                        title={MEAL_LABELS[group.meal_type] ?? group.meal_type}
                        icon={getIconForMealType(group.meal_type)}
                        totalCalories={group.total_calories}
                        onAddFood={() => setActiveMealType(group.meal_type)}
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

            {/* SearchFoodSheet — jeden pro celý DailyMealLog, přepíná se přes activeMealType */}
            <SearchFoodSheet
                isOpen={activeMealType !== null}
                mealType={activeMealType ?? "breakfast"}
                selectedDate={selectedDate}
                onClose={() => setActiveMealType(null)}
                onLogAdded={onLogAdded}
            />
        </>
    );
}