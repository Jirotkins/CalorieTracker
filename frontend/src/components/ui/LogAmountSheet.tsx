import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { ActionSheet } from "./ActionSheet";
import { Button } from "./Button";
import { Input } from "./Input";
import { api } from "../../services/api";
import { type Food } from "../../types/food";
import { type LogItemResponse, MEAL_TYPES, MEAL_LABELS } from "../../types/meal";
import { toLocalDateString } from "../../utils/date";

// Minimum, které sheet potřebuje pro živý přepočet (splňuje ho Food i Recipe)
export type LoggableItem = Pick<Food, "id" | "name" | "calories_per_100g" | "protein_per_100g" | "carbs_per_100g" | "fat_per_100g">;

interface Props {
    isOpen: boolean;
    food: LoggableItem | null;
    mealType: string;
    selectedDate: Date;
    // Vyplněno = editace existujícího záznamu (PUT/DELETE místo POST)
    existingLog?: LogItemResponse | null;
    onClose: () => void;
    // Zavolá se po přidání, úpravě i smazání záznamu
    onLogAdded: () => void;
}

export function LogAmountSheet({ isOpen, food, mealType, selectedDate, existingLog, onClose, onLogAdded }: Props) {
    const [grams, setGrams] = useState("100");
    const [selectedMealType, setSelectedMealType] = useState(mealType);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // První klik na "Smazat" jen žádá o potvrzení
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!existingLog;

    // Při otevření předvyplní hodnoty záznamu (editace) nebo výchozí hodnoty (nový záznam)
    useEffect(() => {
        if (!isOpen) return;
        setGrams(existingLog ? String(existingLog.amount_grams) : "100");
        setSelectedMealType(existingLog?.meal_type ?? mealType);
        setConfirmDelete(false);
        setError(null);
    }, [isOpen, existingLog, mealType]);

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

    const handleSave = async () => {
        if (!food) return;
        if (gramsNum <= 0) {
            setError("Zadej kladné množství gramů.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (existingLog) {
                // Porce se při úpravě přepíše na gramy (výběr porcí přijde v dalším kroku)
                await api.put(`/logs/${existingLog.id}`, {
                    meal_type: selectedMealType,
                    amount_grams: Math.round(gramsNum),
                    portion_id: null,
                    recipe_portion_id: null,
                });
            } else {
                await api.post("/logs/", {
                    food_id: food.id,
                    meal_type: mealType,
                    amount_grams: Math.round(gramsNum),
                    date_consumed: toLocalDateString(selectedDate),
                });
            }
            onLogAdded();
        } catch {
            setError(isEditing ? "Nepodařilo se uložit změny. Zkus to znovu." : "Nepodařilo se zalogovat. Zkus to znovu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingLog) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            await api.delete(`/logs/${existingLog.id}`);
            onLogAdded();
        } catch {
            setError("Nepodařilo se smazat záznam. Zkus to znovu.");
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <ActionSheet isOpen={isOpen} onClose={onClose} title={food?.name ?? "Přidat jídlo"}>

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

            {/* Přesun do jiného jídla dne (jen při editaci) */}
            {isEditing && (
                <div className="flex flex-col">
                    <span className="block text-sm font-medium text-text-muted mb-1 ml-1">Jídlo dne</span>
                    <div className="flex flex-wrap gap-2">
                        {MEAL_TYPES.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedMealType(type)}
                                className={`px-3 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${selectedMealType === type
                                    ? "bg-brand text-white shadow-md"
                                    : "bg-surface-hover text-text-muted"
                                    }`}
                            >
                                {MEAL_LABELS[type]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chybová hláška */}
            {error && (
                <p className="text-sm text-red-400 font-medium text-center">{error}</p>
            )}

            {/* Tlačítko zalogovat / uložit */}
            <Button onClick={handleSave} isLoading={isLoading} disabled={gramsNum <= 0 || isDeleting}>
                {isEditing ? "Uložit změny" : "Zalogovat"}
            </Button>

            {/* Smazání záznamu (jen při editaci, s potvrzením druhým klikem) */}
            {isEditing && (
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting || isLoading}
                    className={`w-full py-3 px-4 rounded-xl font-semibold flex justify-center items-center gap-2 transition-colors disabled:opacity-70 ${confirmDelete
                        ? "bg-red-500 text-white"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        }`}
                >
                    <Trash2 size={18} />
                    {isDeleting ? "Mažu..." : confirmDelete ? "Opravdu smazat?" : "Smazat záznam"}
                </button>
            )}

        </ActionSheet>
    );
}
