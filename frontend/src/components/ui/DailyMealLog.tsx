import { Coffee, Apple, Utensils, Croissant, Moon } from "lucide-react";
import { MealSection } from "./MealSection";
import { FoodLogItem } from "./FoodLogItem";
import { type MealCategoryData } from "../../types/meal";

function getIconForCategory(categoryName: string) {
    switch (categoryName) {
        case "Snídaně": return <Coffee size={22} />;
        case "Dopolední svačina": return <Apple size={22} />;
        case "Oběd": return <Utensils size={22} />;
        case "Odpolední svačina": return <Croissant size={22} />;
        case "Večeře": return <Moon size={22} />;
        default: return <Utensils size={22} />; // Fallback, kdyby backend poslal něco neznámého
    }
}

interface DailyMealLogProps {
    mealsData: MealCategoryData[];
}

export function DailyMealLog({ mealsData }: DailyMealLogProps) {
    return (
        <div className="flex flex-col gap-4">
            {mealsData.map((category) => {
                const sectionCalories = category.items.reduce((sum, item) => sum + item.calories, 0);
                return (
                    <MealSection 
                        key={category.name} 
                        title={category.name}
                        icon={getIconForCategory(category.name)}
                        totalCalories={sectionCalories} 
                    >
                        {category.items.length > 0 && (
                            <div className="flex flex-col border-t border-slate-100 dark:border-slate-800">
                                {category.items.map(food => (
                                    <FoodLogItem 
                                        key={food.id}
                                        name={food.name}
                                        grams={food.grams}
                                        calories={food.calories}
                                        onClickInfo={() => console.log(`Otevřít info pro: ${food.name}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </MealSection>
                );
            })}
        </div>
    );
}