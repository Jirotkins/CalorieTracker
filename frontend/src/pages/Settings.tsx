import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { type User } from "../context/AuthContext";
import { api } from "../services/api";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ActionSheet } from "../components/ui/ActionSheet";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { formatAmount } from "../utils/number";

type GoalKey = Exclude<keyof User, "id" | "username">;

interface GoalConfig {
    key: GoalKey;
    label: string;
    unit: string;
    colorClass: string;
    isSubItem?: boolean;
    isInteger?: boolean;
}

// Pořadí a barvy stejně jako u nutričních hodnot jídla
const GOALS: GoalConfig[] = [
    { key: "daily_calories_goal", label: "Energie", unit: "kcal", colorClass: "text-brand", isInteger: true },
    { key: "daily_fat_goal", label: "Tuky", unit: "g", colorClass: "text-fats" },
    { key: "daily_saturates_goal", label: "z toho nasycené", unit: "g", colorClass: "text-saturates", isSubItem: true },
    { key: "daily_carbs_goal", label: "Sacharidy", unit: "g", colorClass: "text-carbs" },
    { key: "daily_sugar_goal", label: "z toho cukry", unit: "g", colorClass: "text-sugar", isSubItem: true },
    { key: "daily_protein_goal", label: "Bílkoviny", unit: "g", colorClass: "text-protein" },
    { key: "daily_salt_goal", label: "Sůl", unit: "g", colorClass: "text-salt" },
];

export default function Settings() {
    const { user, logout, refreshUser } = useAuth();

    // Právě upravovaný cíl (null = sheet zavřený)
    const [editingGoal, setEditingGoal] = useState<GoalConfig | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [value, setValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openGoal = (goal: GoalConfig) => {
        setEditingGoal(goal);
        setValue(user ? String(user[goal.key]) : "");
        setError(null);
        setIsSheetOpen(true);
    };

    const parsedValue = parseFloat(value.replace(",", "."));

    const handleSave = async () => {
        if (!editingGoal) return;
        if (!(parsedValue > 0)) {
            setError("Zadej kladnou hodnotu.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const newValue = editingGoal.isInteger ? Math.round(parsedValue) : parsedValue;
            await api.put("/users/me", { [editingGoal.key]: newValue });
            await refreshUser();
            setIsSheetOpen(false);
        } catch {
            setError("Nepodařilo se uložit cíl. Zkus to znovu.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10 mt-4">
            <header className="flex flex-col items-center gap-1">
                <h1 className="text-2xl font-bold text-text-main">Nastavení</h1>
                <p className="text-text-muted font-medium">Tvůj profil a preference</p>
            </header>

            {/* Nastavení vzhledu */}
            <div className="flex justify-between items-center bg-surface p-4 rounded-3xl border border-surface-hover">
                <span className="font-medium">Světlý / tmavý režim</span>
                <ThemeToggle />
            </div>

            {/* Denní cíle */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Denní cíle</label>
                <div className="bg-surface rounded-3xl overflow-hidden border border-surface-hover">
                    {GOALS.map((goal) => (
                        <button
                            key={goal.key}
                            type="button"
                            onClick={() => openGoal(goal)}
                            className={`w-full flex items-center justify-between border-b border-surface-hover last:border-0 active:bg-surface-hover transition-colors text-left
                                ${goal.isSubItem ? "py-3 pl-8 pr-4" : "p-4"}`}
                        >
                            <span className={goal.isSubItem ? "text-sm font-medium text-text-muted" : "font-semibold text-text-main"}>
                                {goal.label}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className={`font-bold ${goal.colorClass}`}>
                                    {user ? formatAmount(user[goal.key]) : "–"} {goal.unit}
                                </span>
                                <ChevronRight size={18} className="text-text-muted" />
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Odhlášení jako velké varovné tlačítko */}
            <button
                onClick={logout}
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-semibold p-4 rounded-3xl mt-4"
            >
                Odhlásit se
            </button>

            {/* Verze appky (čas buildu) — pro kontrolu, že se po deployi načetla nová verze */}
            <p className="text-center text-xs text-text-muted">
                Verze: {new Date(__APP_BUILD_TIME__).toLocaleString("cs-CZ")}
            </p>

            {/* Úprava jednoho cíle */}
            <ActionSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title={editingGoal ? `Cíl: ${editingGoal.label}` : "Denní cíl"}
            >
                <Input
                    id="goal-value"
                    label={`Denní cíl (${editingGoal?.unit ?? ""})`}
                    type="text"
                    inputMode={editingGoal?.isInteger ? "numeric" : "decimal"}
                    value={value}
                    onChange={(e) => {
                        setError(null);
                        setValue(e.target.value);
                    }}
                />

                {error && (
                    <p className="text-sm text-red-400 font-medium text-center">{error}</p>
                )}

                <Button onClick={handleSave} isLoading={isSaving} disabled={!(parsedValue > 0)}>
                    Uložit cíl
                </Button>
            </ActionSheet>
        </main>
    );
}
