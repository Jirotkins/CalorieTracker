import { useState, useEffect } from "react";
import { Search, X, Plus, Barcode, PenLine, Loader2, Utensils, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { type Food } from "../../types/food";
import { LogAmountSheet } from "./LogAmountSheet";

interface Props {
    isOpen: boolean;
    mealType: string;
    selectedDate: Date;
    onClose: () => void;
    onLogAdded: () => void;
}

// Překlad meal_type na češtinu pro záhlaví sheetu
const MEAL_LABELS: Record<string, string> = {
    breakfast: "Snídaně",
    morning_snack: "Dopolední svačina",
    lunch: "Oběd",
    afternoon_snack: "Odpolední svačina",
    dinner: "Večeře",
};

export function SearchFoodSheet({ isOpen, mealType, selectedDate, onClose, onLogAdded }: Props) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Food[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    // Nejčastěji přidávaná jídla — fetchují se při otevření sheetu
    const [frequentFoods, setFrequentFoods] = useState<Food[]>([]);
    const [isLoadingFrequent, setIsLoadingFrequent] = useState(false);

    // Fetch nejčastějších jídel při každém otevření sheetu
    // useEffect s [isOpen]: spustí se pokaždé při změně isOpen
    // Podmínka `if (!isOpen) return` = fetch jen při otevření, ne při zavření
    useEffect(() => {
        if (!isOpen) return;

        setIsLoadingFrequent(true);
        api.get<Food[]>("/foods/frequent?limit=5")
            .then((res) => setFrequentFoods(res.data))
            .catch(() => setFrequentFoods([]))
            .finally(() => setIsLoadingFrequent(false));
    }, [isOpen]);

    // Debounced vyhledávání — 400ms po posledním stisku klávesy
    useEffect(() => {
        if (!isOpen) return; // nespouštěj pokud je sheet zavřený

        if (query.trim() === "") {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        const timer = setTimeout(async () => {
            try {
                // Paralelně zavolej obě API — osobní + globální jídla
                const [personalRes, globalRes] = await Promise.all([
                    api.get<Food[]>(`/foods/me?search=${encodeURIComponent(query)}`),
                    api.get<Food[]>(`/foods/?search=${encodeURIComponent(query)}`),
                ]);
                // Osobní jídla nahoře, globální dole; deduplikace podle id
                const combined = [...personalRes.data, ...globalRes.data];
                const seen = new Set<number>();
                const deduped = combined.filter((f) => {
                    if (seen.has(f.id)) return false;
                    seen.add(f.id);
                    return true;
                });
                setResults(deduped);
            } catch {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        // Cleanup: zruší předchozí timer při každém novém stisku klávesy
        return () => clearTimeout(timer);
    }, [query, isOpen]);

    // Reset state při zavření sheetu
    const handleClose = () => {
        setQuery("");
        setResults([]);
        setSelectedFood(null);
        setIsAddMenuOpen(false);
        setFrequentFoods([]);
        onClose();
    };

    // Po zalogování — zavři celý stack sheetů a signalizuj rodiči
    const handleLogAdded = () => {
        handleClose();
        onLogAdded();
    };

    const mealLabel = MEAL_LABELS[mealType] ?? mealType;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    onClick={handleClose}
                />
            )}

            {/* Hlavní sheet — full-height bottom sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-[32px] flex flex-col
                    transition-transform duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
                    dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
                    ${isOpen ? "translate-y-0" : "translate-y-full"}`}
                style={{ height: "90dvh" }}
            >
                {/* iOS Drag Handle */}
                <div className="w-12 h-1.5 bg-surface-hover rounded-full mx-auto mt-4 shrink-0" />

                {/* Záhlaví */}
                <div className="flex justify-between items-center px-6 pt-4 pb-2 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-text-main">Přidat jídlo</h3>
                        <p className="text-sm text-text-muted font-medium">{mealLabel}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 bg-surface-hover hover:bg-surface-hover/80 rounded-full text-text-muted transition-colors"
                        aria-label="Zavřít"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Vyhledávací input */}
                <div className="px-6 py-3 shrink-0">
                    <div className="relative flex items-center">
                        <Search size={18} className="absolute left-4 text-text-muted pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Hledat jídlo..."
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-hover border border-transparent
                                focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all
                                text-text-main placeholder-text-muted/60 font-medium text-base"
                        />
                        {isSearching && (
                            <Loader2 size={18} className="absolute right-4 text-brand animate-spin" />
                        )}
                    </div>
                </div>

                {/* Scrollovatelný obsah */}
                <div className="flex-1 overflow-y-auto px-6 pb-4">

                    {/* ── RYCHLÝ VÝBĚR: Nejčastější jídla (zobrazí se jen pokud nepíšeme) ── */}
                    {query.trim() === "" && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3 mt-1">
                                <Clock size={14} className="text-text-muted" />
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                    Rychlý výběr
                                </span>
                            </div>

                            {/* Skeleton loading */}
                            {isLoadingFrequent && (
                                <div className="flex flex-col gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-[60px] bg-surface-hover rounded-2xl animate-pulse"
                                            style={{ opacity: 1 - i * 0.18 }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Karta nejčastějšího jídla — stejný design jako search výsledky */}
                            {!isLoadingFrequent && frequentFoods.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {frequentFoods.map((food) => (
                                        <button
                                            key={food.id}
                                            onClick={() => setSelectedFood(food)}
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-surface-hover
                                                hover:border-brand/40 hover:bg-brand/5 active:scale-[0.98]
                                                transition-all text-left w-full shadow-sm"
                                        >
                                            <div className="w-12 h-12 shrink-0 bg-surface-hover rounded-xl flex items-center justify-center overflow-hidden border border-surface-hover">
                                                {food.photo_url ? (
                                                    <img src={food.photo_url} alt={food.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Utensils size={20} className="text-brand" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-text-main text-sm leading-tight truncate">{food.name}</p>
                                                <div className="flex gap-2 text-[11px] font-semibold mt-0.5">
                                                    <span className="text-protein">B: {food.protein_per_100g}g</span>
                                                    <span className="text-carbs">S: {food.carbs_per_100g}g</span>
                                                    <span className="text-fats">T: {food.fat_per_100g}g</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end">
                                                <span className="text-brand font-black text-lg leading-tight">{food.calories_per_100g}</span>
                                                <span className="text-text-muted text-[9px] font-semibold uppercase tracking-wider">kcal/100g</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Separator — odděluje rychlý výběr od prázdného stavu / search pole */}
                            {!isLoadingFrequent && frequentFoods.length > 0 && (
                                <div className="flex items-center gap-3 mt-5 mb-2">
                                    <div className="flex-1 h-px bg-surface-hover" />
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">nebo hledej výše</span>
                                    <div className="flex-1 h-px bg-surface-hover" />
                                </div>
                            )}

                            {/* Prázdný stav — uživatel zatím nic nezalogoval */}
                            {!isLoadingFrequent && frequentFoods.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                                    <div className="p-4 bg-brand/10 rounded-full">
                                        <Search size={28} className="text-brand" />
                                    </div>
                                    <p className="text-text-main font-bold">Začni psát</p>
                                    <p className="text-text-muted text-sm max-w-[220px]">
                                        Vyhledej jídlo ze databáze nebo ho přidej ručně
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SEARCH VÝSLEDKY (zobrazí se jen pokud píšeme) ── */}
                    {results.length > 0 && (
                        <div className="flex flex-col gap-2 pt-1">
                            {results.map((food) => (
                                <button
                                    key={food.id}
                                    onClick={() => setSelectedFood(food)}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-surface-hover
                                        hover:border-brand/40 hover:bg-brand/5 active:scale-[0.98]
                                        transition-all text-left w-full shadow-sm"
                                >
                                    {/* Fotka nebo placeholder */}
                                    <div className="w-12 h-12 shrink-0 bg-surface-hover rounded-xl flex items-center justify-center overflow-hidden border border-surface-hover">
                                        {food.photo_url ? (
                                            <img
                                                src={food.photo_url}
                                                alt={food.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Utensils size={20} className="text-brand" />
                                        )}
                                    </div>

                                    {/* Název + makra */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-text-main text-sm leading-tight truncate">
                                            {food.name}
                                        </p>
                                        <div className="flex gap-2 text-[11px] font-semibold mt-0.5">
                                            <span className="text-protein">B: {food.protein_per_100g}g</span>
                                            <span className="text-carbs">S: {food.carbs_per_100g}g</span>
                                            <span className="text-fats">T: {food.fat_per_100g}g</span>
                                        </div>
                                    </div>

                                    {/* Kcal */}
                                    <div className="shrink-0 flex flex-col items-end">
                                        <span className="text-brand font-black text-lg leading-tight">
                                            {food.calories_per_100g}
                                        </span>
                                        <span className="text-text-muted text-[9px] font-semibold uppercase tracking-wider">
                                            kcal/100g
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Žádné výsledky */}
                    {query.trim() !== "" && !isSearching && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-10">
                            <div className="p-5 bg-surface-hover rounded-full">
                                <Utensils size={32} className="text-text-muted" />
                            </div>
                            <p className="text-text-main font-bold text-lg">Nic nenalezeno</p>
                            <p className="text-text-muted text-sm">
                                Jídlo „<span className="font-semibold">{query}</span>" není v databázi
                            </p>
                        </div>
                    )}
                </div>


                {/* Spodní tlačítko "Přidat nové jídlo" — vždy viditelné */}
                <div className="shrink-0 px-6 pb-6 pt-3 border-t border-surface-hover">
                    <button
                        onClick={() => setIsAddMenuOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl
                            border-2 border-dashed border-brand/40 text-brand font-semibold
                            hover:bg-brand/10 hover:border-brand active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Přidat nové jídlo
                    </button>
                </div>
            </div>

            {/* LogAmountSheet — otevře se po výběru jídla */}
            <LogAmountSheet
                isOpen={selectedFood !== null}
                food={selectedFood}
                mealType={mealType}
                selectedDate={selectedDate}
                onClose={() => setSelectedFood(null)}
                onLogAdded={handleLogAdded}
            />

            {/* ActionSheet pro přidání nového jídla (scanner / ručně) */}
            {isAddMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
                        onClick={() => setIsAddMenuOpen(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 z-[90] bg-surface rounded-t-[32px] p-6
                        shadow-[0_-10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="w-12 h-1.5 bg-surface-hover rounded-full mx-auto mb-6" />
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-main">Přidat nové jídlo</h3>
                            <button
                                onClick={() => setIsAddMenuOpen(false)}
                                className="p-2 bg-surface-hover rounded-full text-text-muted transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { handleClose(); navigate("/scanner"); }}
                                className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                            >
                                <div className="bg-surface p-3 rounded-xl shadow-sm">
                                    <Barcode size={22} className="text-brand" />
                                </div>
                                <div>
                                    <span className="block font-bold">Naskenovat kód</span>
                                    <span className="block text-xs text-text-muted mt-0.5">Rychlé přidání foťákem</span>
                                </div>
                            </button>
                            <button
                                onClick={() => { handleClose(); navigate("/foods/new"); }}
                                className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                            >
                                <div className="bg-surface p-3 rounded-xl shadow-sm">
                                    <PenLine size={22} className="text-brand" />
                                </div>
                                <div>
                                    <span className="block font-bold">Zadat ručně</span>
                                    <span className="block text-xs text-text-muted mt-0.5">Vyplnit nutriční hodnoty v aplikaci</span>
                                </div>
                            </button>
                        </div>
                        <div className="h-8" />
                    </div>
                </>
            )}
        </>
    );
}
