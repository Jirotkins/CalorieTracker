import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Apple, Utensils, Croissant, Moon } from "lucide-react";
import { MealSection } from "./MealSection";
import { FoodLogItem } from "./FoodLogItem";
import { SearchFoodSheet } from "./SearchFoodSheet";
import { LogAmountSheet, type LoggableItem } from "./LogAmountSheet";
import { api } from "../../services/api";
import { type MealGroupSummary, type LogItemResponse, MEAL_LABELS } from "../../types/meal";
import { formatAmount } from "../../utils/number";

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

// Záloha pro smazaná jídla (API je už nevrátí) — hodnoty na 100 g dopočítá ze záznamu
function sourceFromLogItem(item: LogItemResponse): LoggableItem {
    const ratio = item.amount_grams > 0 ? 100 / item.amount_grams : 0;
    return {
        id: item.food_id ?? item.recipe_id ?? 0,
        name: item.food_name ?? item.recipe_name ?? "Neznámé jídlo",
        calories_per_100g: item.calories * ratio,
        protein_per_100g: item.protein * ratio,
        carbs_per_100g: item.carbs * ratio,
        fat_per_100g: item.fat * ratio,
        portions: [],
    };
}

interface DailyMealLogProps {
    mealsData: MealGroupSummary[];
    selectedDate: Date;
    onLogAdded: () => void;
}

export function DailyMealLog({ mealsData, selectedDate, onLogAdded }: DailyMealLogProps) {
    const navigate = useNavigate();
    // null = sheet zavřen; string = sheet otevřen pro daný meal_type
    const [activeMealType, setActiveMealType] = useState<string | null>(null);

    // Editace existujícího záznamu
    const [editingLog, setEditingLog] = useState<LogItemResponse | null>(null);
    const [editingSource, setEditingSource] = useState<LoggableItem | null>(null);
    // Samostatný flag, aby se obsah sheetu neměnil během animace zavírání
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Načte hodnoty jídla/receptu na 100 g a otevře sheet v režimu úprav
    const openEdit = async (item: LogItemResponse) => {
        const endpoint = item.food_id ? `/foods/${item.food_id}` : `/recipes/${item.recipe_id}`;
        try {
            const res = await api.get<LoggableItem>(endpoint);
            setEditingSource(res.data);
        } catch {
            setEditingSource(sourceFromLogItem(item));
        }
        setEditingLog(item);
        setIsEditOpen(true);
    };

    const handleEditDone = () => {
        setIsEditOpen(false);
        onLogAdded();
    };

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
                                        portionLabel={item.portion_name && item.portion_count
                                            ? `${formatAmount(item.portion_count)}× ${item.portion_name}`
                                            : undefined}
                                        calories={item.calories}
                                        onClickItem={() => openEdit(item)}
                                        onClickInfo={item.food_id ? () => navigate(`/foods/${item.food_id}`) : undefined}
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

            {/* LogAmountSheet v režimu úprav existujícího záznamu */}
            <LogAmountSheet
                isOpen={isEditOpen}
                food={editingSource}
                mealType={editingLog?.meal_type ?? "breakfast"}
                selectedDate={selectedDate}
                existingLog={editingLog}
                onClose={() => setIsEditOpen(false)}
                onLogAdded={handleEditDone}
            />
        </>
    );
}
