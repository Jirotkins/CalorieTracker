import { useState } from "react";
import { ActionSheet } from "./ActionSheet";
import { Button } from "./Button";
import { Input } from "./Input";
import { api } from "../../services/api";
import { type Food } from "../../types/food";

interface Props {
    isOpen: boolean;
    food: Food | null;
    mealType: string;
    selectedDate: Date;
    onClose: () => void;
    onLogAdded: () => void;
}

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function LogAmountSheet({ isOpen, food, mealType, selectedDate, onClose, onLogAdded }: Props) {
    const [grams, setGrams] = useState("100");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Kalkulace kcal v reálném čase
    const gramsNum = parseFloat(grams) || 0;
    const calculatedKcal = food
        ? Math.round((food.calories_per_100g * gramsNum) / 100)
        : 0;
    const calculatedProtein = food
        ? ((food.protein_per_100g * gramsNum) / 100).toFixed(1)
        : "0";
    const calculatedCarbs = food
        ? ((food.carbs_per_100g * gramsNum) / 100).toFixed(1)
        : "0";
    const calculatedFat = food
        ? ((food.fat_per_100g * gramsNum) / 100).toFixed(1)
        : "0";

    const handleLog = async () => {
        if (!food) return;
        if (gramsNum <= 0) {
            setError("Zadej kladné množství gramů.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post("/logs/", {
                food_id: food.id,
                meal_type: mealType,
                amount_grams: Math.round(gramsNum),
                date_consumed: formatDate(selectedDate),
            });
            setGrams("100"); // reset pro příště
            onLogAdded();
        } catch {
            setError("Nepodařilo se zalogovat. Zkus to znovu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setGrams("100");
        setError(null);
        onClose();
    };

    return (
        <ActionSheet isOpen={isOpen} onClose={handleClose} title={food?.name ?? "Přidat jídlo"}>

            {/* Live kcal displej */}
            <div className="flex flex-col items-center py-4 gap-1">
                <span className="text-6xl font-black text-brand tabular-nums leading-none">
                    {calculatedKcal}
                </span>
                <span className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                    kcal
                </span>
            </div>

            {/* Live makra */}
            <div className="flex justify-center gap-6 pb-4">
                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-protein">{calculatedProtein}g</span>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Bílk.</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-carbs">{calculatedCarbs}g</span>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Sacharidy</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-fats">{calculatedFat}g</span>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Tuky</span>
                </div>
            </div>

            {/* Input gramů */}
            <Input
                id="log-amount-grams"
                label="Množství (gramy)"
                type="number"
                min="1"
                step="1"
                value={grams}
                onChange={(e) => {
                    setError(null);
                    setGrams(e.target.value);
                }}
                inputMode="decimal"
                autoFocus
            />

            {/* Chybová hláška */}
            {error && (
                <p className="text-sm text-red-400 font-medium text-center">{error}</p>
            )}

            {/* Tlačítko zalogovat */}
            <Button onClick={handleLog} isLoading={isLoading} disabled={gramsNum <= 0}>
                Zalogovat
            </Button>

        </ActionSheet>
    );
}
