import { useState, useEffect, type ReactNode } from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import { ActionSheet } from "./ActionSheet";
import { Button } from "./Button";
import { Input } from "./Input";
import { Tabs } from "./Tabs";
import { api } from "../../services/api";
import { type Food, type FoodPortion } from "../../types/food";
import { type LogItemResponse, MEAL_TYPES, MEAL_LABELS } from "../../types/meal";
import { toLocalDateString } from "../../utils/date";
import { formatAmount } from "../../utils/number";
import { useToast } from "../../hooks/useToast";

// Minimum, které sheet potřebuje pro živý přepočet (splňuje ho Food i Recipe)
export type LoggableItem = Pick<Food, "id" | "name" | "calories_per_100g" | "protein_per_100g" | "carbs_per_100g" | "fat_per_100g" | "portions">;

type AmountMode = "portion" | "grams";

const PORTION_STEP = 0.5;

interface Props {
    isOpen: boolean;
    food: LoggableItem | null;
    // Nový záznam receptu (u editace se pozná podle existingLog.recipe_id)
    isRecipe?: boolean;
    mealType: string;
    selectedDate: Date;
    // Vyplněno = editace existujícího záznamu (PUT/DELETE místo POST)
    existingLog?: LogItemResponse | null;
    onClose: () => void;
    // Zavolá se po přidání, úpravě i smazání záznamu
    onLogAdded: () => void;
}

// Výběrová "pilulka" (porce, jídlo dne)
function ChoicePill({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${isActive
                ? "bg-brand text-white shadow-md"
                : "bg-surface-hover text-text-muted"
                }`}
        >
            {children}
        </button>
    );
}

// Vrátí počet porcí, pokud gramy záznamu odpovídají násobku kroku (jinak null → režim gramů)
function portionCountFor(grams: number, portion: FoodPortion): number | null {
    const count = Math.round(grams / portion.weight_grams / PORTION_STEP) * PORTION_STEP;
    return count > 0 && Math.round(count * portion.weight_grams) === grams ? count : null;
}

export function LogAmountSheet({ isOpen, food, isRecipe: isNewRecipe = false, mealType, selectedDate, existingLog, onClose, onLogAdded }: Props) {
    const [mode, setMode] = useState<AmountMode>("grams");
    const [grams, setGrams] = useState("100");
    const [selectedPortionId, setSelectedPortionId] = useState<number | null>(null);
    const [portionCount, setPortionCount] = useState(1);
    const [selectedMealType, setSelectedMealType] = useState(mealType);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // První klik na "Smazat" jen žádá o potvrzení
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const isEditing = !!existingLog;
    const portions = food?.portions ?? [];
    const selectedPortion = portions.find((p) => p.id === selectedPortionId) ?? null;

    // Při otevření předvyplní hodnoty záznamu (editace) nebo výchozí hodnoty (nový záznam)
    useEffect(() => {
        if (!isOpen) return;
        const availablePortions = food?.portions ?? [];

        if (existingLog) {
            const logPortionId = existingLog.portion_id ?? existingLog.recipe_portion_id;
            const logPortion = availablePortions.find((p) => p.id === logPortionId);
            const count = logPortion ? portionCountFor(existingLog.amount_grams, logPortion) : null;

            setGrams(String(existingLog.amount_grams));
            setMode(logPortion && count ? "portion" : "grams");
            setSelectedPortionId(logPortion?.id ?? availablePortions[0]?.id ?? null);
            setPortionCount(count ?? 1);
        } else {
            // Nové jídlo s porcemi začne na první porci, jinak 100 g
            setGrams("100");
            setMode(availablePortions.length > 0 ? "portion" : "grams");
            setSelectedPortionId(availablePortions[0]?.id ?? null);
            setPortionCount(1);
        }

        setSelectedMealType(existingLog?.meal_type ?? mealType);
        setConfirmDelete(false);
        setError(null);
    }, [isOpen, existingLog, mealType, food]);

    // Výsledné gramy podle režimu (do API jdou vždy gramy)
    const gramsNum = mode === "portion" && selectedPortion
        ? Math.round(portionCount * selectedPortion.weight_grams)
        : parseFloat(grams) || 0;

    // Kalkulace kcal v reálném čase
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

    // Přepnutí režimu: z porcí do gramů převezme aktuální gramy, aby šly doladit
    const handleModeChange = (nextMode: AmountMode) => {
        if (nextMode === "grams" && mode === "portion") {
            setGrams(String(gramsNum));
        }
        setError(null);
        setMode(nextMode);
    };

    const handleSave = async () => {
        if (!food) return;
        if (gramsNum <= 0) {
            setError("Zadej kladné množství gramů.");
            return;
        }

        setIsLoading(true);
        setError(null);

        // Porce se ukládá jen jako popisek, výpočet jde vždy z gramů
        const portionId = mode === "portion" ? selectedPortion?.id ?? null : null;
        // Recept má vlastní typ porcí i vlastní ID v záznamu
        const isRecipe = existingLog ? !!existingLog.recipe_id : isNewRecipe;

        try {
            if (existingLog) {
                await api.put(`/logs/${existingLog.id}`, {
                    meal_type: selectedMealType,
                    amount_grams: Math.round(gramsNum),
                    portion_id: isRecipe ? null : portionId,
                    recipe_portion_id: isRecipe ? portionId : null,
                });
            } else {
                await api.post("/logs/", {
                    food_id: isRecipe ? null : food.id,
                    recipe_id: isRecipe ? food.id : null,
                    meal_type: mealType,
                    amount_grams: Math.round(gramsNum),
                    portion_id: isRecipe ? null : portionId,
                    recipe_portion_id: isRecipe ? portionId : null,
                    date_consumed: toLocalDateString(selectedDate),
                });
            }
            showToast(isEditing ? "Změny uloženy" : "Zalogováno");
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
            showToast("Záznam smazán");
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

            {/* Přepínač Porce | Gramy (jen pokud jídlo nějaké porce má) */}
            {portions.length > 0 && (
                <div className="flex">
                    <Tabs<AmountMode>
                        options={[
                            { id: "portion", label: "Porce" },
                            { id: "grams", label: "Gramy" },
                        ]}
                        activeTab={mode}
                        onChange={handleModeChange}
                    />
                </div>
            )}

            {mode === "portion" && selectedPortion ? (
                <div className="flex flex-col gap-3">
                    {/* Výběr porce */}
                    <div className="flex flex-wrap gap-2">
                        {portions.map((portion) => (
                            <ChoicePill
                                key={portion.id}
                                isActive={portion.id === selectedPortion.id}
                                onClick={() => setSelectedPortionId(portion.id)}
                            >
                                {portion.name} ({portion.weight_grams} g)
                            </ChoicePill>
                        ))}
                    </div>

                    {/* Počet porcí */}
                    <div className="flex items-center justify-between bg-surface-hover rounded-xl p-1.5">
                        <button
                            type="button"
                            onClick={() => setPortionCount((c) => Math.max(PORTION_STEP, c - PORTION_STEP))}
                            disabled={portionCount <= PORTION_STEP}
                            className="p-3 rounded-lg bg-surface text-brand shadow-sm active:scale-90 transition-all disabled:opacity-40"
                            aria-label="Ubrat porci"
                        >
                            <Minus size={20} />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-text-main tabular-nums">
                                {formatAmount(portionCount)}×
                            </span>
                            <span className="text-xs font-semibold text-text-muted">{gramsNum} g</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPortionCount((c) => c + PORTION_STEP)}
                            className="p-3 rounded-lg bg-surface text-brand shadow-sm active:scale-90 transition-all"
                            aria-label="Přidat porci"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Input gramů */
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
                />
            )}

            {/* Přesun do jiného jídla dne (jen při editaci) */}
            {isEditing && (
                <div className="flex flex-col">
                    <span className="block text-sm font-medium text-text-muted mb-1 ml-1">Jídlo dne</span>
                    <div className="flex flex-wrap gap-2">
                        {MEAL_TYPES.map((type) => (
                            <ChoicePill
                                key={type}
                                isActive={selectedMealType === type}
                                onClick={() => setSelectedMealType(type)}
                            >
                                {MEAL_LABELS[type]}
                            </ChoicePill>
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
