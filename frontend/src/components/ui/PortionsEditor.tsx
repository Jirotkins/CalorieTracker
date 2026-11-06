import { Plus, Trash2 } from "lucide-react";
import { type PortionRow, newPortionRow } from "../../utils/portions";

interface Props {
    portions: PortionRow[];
    onChange: (portions: PortionRow[]) => void;
}

// Sekce "Porce" ve formuláři jídla i receptu (kus, balení, talíř...)
export function PortionsEditor({ portions, onChange }: Props) {
    const addPortion = () => {
        onChange([...portions, newPortionRow()]);
    };

    const updatePortion = (key: number, field: "name" | "weight_grams", value: string) => {
        // Váha porce - pouze celá čísla
        if (field === "weight_grams" && value !== "" && !/^\d*$/.test(value)) return;
        onChange(portions.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
    };

    const removePortion = (key: number) => {
        onChange(portions.filter((p) => p.key !== key));
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Porce</label>
            <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                {portions.map((portion) => (
                    <div key={portion.key} className="flex items-center gap-3 p-4 border-b border-surface-hover">
                        <input
                            required
                            type="text"
                            placeholder="Název (např. kus)"
                            value={portion.name}
                            onChange={(e) => updatePortion(portion.key, "name", e.target.value)}
                            className="flex-1 min-w-0 bg-transparent text-text-main font-semibold focus:outline-none placeholder-text-muted/50"
                        />
                        <input
                            required
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={portion.weight_grams}
                            onChange={(e) => updatePortion(portion.key, "weight_grams", e.target.value)}
                            className="w-16 text-right bg-transparent text-brand font-bold focus:outline-none placeholder-text-muted/50"
                        />
                        <span className="text-sm font-semibold text-text-muted">g</span>
                        <button
                            type="button"
                            onClick={() => removePortion(portion.key)}
                            className="p-1 text-red-400 active:scale-90 transition-transform"
                            aria-label="Odebrat porci"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addPortion}
                    className="w-full flex items-center gap-2 p-4 text-brand font-semibold active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Přidat porci
                </button>
            </div>
        </div>
    );
}
