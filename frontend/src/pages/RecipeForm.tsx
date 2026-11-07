import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Utensils } from "lucide-react";
import { api } from "../services/api";
import { type Food } from "../types/food";
import { type Recipe } from "../types/recipe";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { useToast } from "../hooks/useToast";
import { PhotoPicker } from "../components/ui/PhotoPicker";
import { PortionsEditor } from "../components/ui/PortionsEditor";
import { type PortionRow, toPortionRows, toPortionPayload, hasInvalidPortion } from "../utils/portions";
import { SearchFoodSheet } from "../components/ui/SearchFoodSheet";

// Řádek ingredience ve formuláři
interface IngredientRow {
    key: number;
    food: Food;
    amount_grams: string;
}

// Unikátní klíč pro React (stejné jídlo může být v receptu víckrát)
let nextIngredientKey = 0;

// Makra, která se v náhledu sčítají z ingrediencí
const PREVIEW_KEYS = ["calories", "protein", "carbs", "fat"] as const;

// Stránka pro nový recept (/recipes/new) i úpravu existujícího (/recipes/:id/edit)
export default function RecipeForm() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { id } = useParams();
    const isEditMode = !!id;

    // V režimu úprav se formulář zobrazí až po načtení receptu
    const [isLoaded, setIsLoaded] = useState(!isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Stav formuláře
    const [name, setName] = useState("");
    const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
    // Váha hotového jídla (po uvaření); prázdné = součet ingrediencí
    const [finalWeight, setFinalWeight] = useState("");
    const [portions, setPortions] = useState<PortionRow[]>([]);
    const { photoUrl, isUploading, uploadPhoto, setOriginalPhoto, commitPhoto } = usePhotoUpload();

    // Režim úprav: načte recept a předvyplní formulář
    useEffect(() => {
        if (!isEditMode) return;
        api.get<Recipe>(`/recipes/${id}`)
            .then((res) => {
                setName(res.data.name);
                setIngredients(res.data.ingredients.map((ing) => ({
                    key: nextIngredientKey++,
                    food: ing.food,
                    amount_grams: String(ing.amount_grams),
                })));
                setFinalWeight(res.data.final_weight_grams ? String(res.data.final_weight_grams) : "");
                setPortions(toPortionRows(res.data.portions));
                setOriginalPhoto(res.data.photo_url);
                setIsLoaded(true);
            })
            .catch((error) => {
                console.error("Chyba při načítání receptu:", error);
                showToast("Nepodařilo se načíst recept.", "error");
                navigate(-1);
            });
    }, [id, isEditMode, navigate, setOriginalPhoto, showToast]);

    // Ingredience: přidání (ze sheetu), změna gramů, odebrání
    const addIngredient = (food: Food) => {
        setIngredients((prev) => [...prev, { key: nextIngredientKey++, food, amount_grams: "100" }]);
    };

    const updateAmount = (key: number, value: string) => {
        // Gramy - pouze celá čísla
        if (value !== "" && !/^\d*$/.test(value)) return;
        setIngredients(ingredients.map((ing) => (ing.key === key ? { ...ing, amount_grams: value } : ing)));
    };

    const removeIngredient = (key: number) => {
        setIngredients(ingredients.filter((ing) => ing.key !== key));
    };

    // Živý náhled: součty z ingrediencí, přepočet na finální váhu
    const rawWeight = ingredients.reduce((sum, ing) => sum + (parseInt(ing.amount_grams) || 0), 0);
    const totals = Object.fromEntries(PREVIEW_KEYS.map((key) => [
        key,
        ingredients.reduce((sum, ing) => sum + ing.food[`${key}_per_100g`] * (parseInt(ing.amount_grams) || 0) / 100, 0),
    ])) as Record<typeof PREVIEW_KEYS[number], number>;
    const totalWeight = parseInt(finalWeight) || rawWeight;
    const per100 = (value: number) => (totalWeight > 0 ? (value / totalWeight) * 100 : 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (ingredients.length === 0) {
            showToast("Přidej aspoň jednu ingredienci.", "error");
            return;
        }
        if (ingredients.some((ing) => !(parseInt(ing.amount_grams) > 0))) {
            showToast("Množství ingredience musí být větší než 0 g.", "error");
            return;
        }
        if (hasInvalidPortion(portions)) {
            showToast("Váha porce musí být větší než 0 g.", "error");
            return;
        }
        setIsSaving(true);

        const recipeValues = {
            name: name.trim(),
            photo_url: photoUrl || null,
            final_weight_grams: parseInt(finalWeight) || null,
            ingredients: ingredients.map((ing) => ({
                food_id: ing.food.id,
                amount_grams: parseInt(ing.amount_grams),
            })),
            portions: toPortionPayload(portions),
        };

        try {
            if (isEditMode) {
                await api.put(`/recipes/${id}`, recipeValues);
                commitPhoto();
                showToast("Změny uloženy");
                navigate(-1);
            } else {
                const response = await api.post<Recipe>("/recipes/", recipeValues);
                commitPhoto();
                showToast("Recept uložen");
                // Po vytvoření rovnou detail receptu (zpět vede do seznamu receptů, ne do formuláře)
                navigate(`/recipes/${response.data.id}`, { replace: true });
            }
        } catch (error) {
            console.error("Chyba při ukládání receptu:", error);
            showToast("Nepodařilo se uložit recept.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <main className="w-full flex flex-col min-h-screen bg-surface-hover">
                <header className="flex items-center justify-between p-4 bg-surface sticky top-0 z-20 shadow-sm pt-[calc(1rem+env(safe-area-inset-top))]">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand">
                        <ChevronLeft size={28} />
                    </button>
                    <h1 className="text-lg font-bold text-text-main">{isEditMode ? "Upravit recept" : "Nový recept"}</h1>
                    <div className="w-10" />
                </header>

                {!isLoaded ? (
                    <p className="text-center mt-20 text-text-muted animate-pulse">Načítám...</p>
                ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 pb-12 max-w-md mx-auto w-full">

                    {/* Fotka */}
                    <PhotoPicker photoUrl={photoUrl} isUploading={isUploading} onSelectFile={uploadPhoto} />

                    {/* Název */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Základní</label>
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4">
                                <span className="font-semibold text-text-main shrink-0 w-24">Název</span>
                                <input
                                    required
                                    type="text"
                                    placeholder="Např. Špagety bolognese"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full text-right bg-transparent text-text-main font-semibold focus:outline-none placeholder-text-muted/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ingredience */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider flex justify-between pr-4">
                            <span>Ingredience</span>
                            {rawWeight > 0 && <span>{rawWeight} g</span>}
                        </label>
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                            {ingredients.map((ing) => (
                                <div key={ing.key} className="flex items-center gap-3 p-3 pl-4 border-b border-surface-hover">
                                    <div className="w-10 h-10 shrink-0 bg-surface-hover rounded-xl flex items-center justify-center overflow-hidden">
                                        {ing.food.photo_url ? (
                                            <img src={ing.food.photo_url} alt={ing.food.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Utensils size={18} className="text-brand" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-text-main truncate">{ing.food.name}</p>
                                        <p className="text-xs text-text-muted">
                                            {Math.round(ing.food.calories_per_100g * (parseInt(ing.amount_grams) || 0) / 100)} kcal
                                        </p>
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={ing.amount_grams}
                                        onChange={(e) => updateAmount(ing.key, e.target.value)}
                                        onFocus={(e) => {
                                            const input = e.target;
                                            setTimeout(() => input.select(), 0);
                                        }}
                                        className="w-14 text-right bg-transparent text-brand font-bold focus:outline-none placeholder-text-muted/50"
                                        aria-label={`Množství ${ing.food.name}`}
                                    />
                                    <span className="text-sm font-semibold text-text-muted">g</span>
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(ing.key)}
                                        className="p-1 text-red-400 active:scale-90 transition-transform"
                                        aria-label="Odebrat ingredienci"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsPickerOpen(true)}
                                className="w-full flex items-center gap-2 p-4 text-brand font-semibold active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                                Přidat ingredienci
                            </button>
                        </div>
                    </div>

                    {/* Váha po uvaření */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Hotové jídlo</label>
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4 gap-3">
                                <span className="font-semibold text-text-main">Váha po uvaření</span>
                                <span className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={rawWeight > 0 ? String(rawWeight) : "0"}
                                        value={finalWeight}
                                        onChange={(e) => {
                                            if (e.target.value !== "" && !/^\d*$/.test(e.target.value)) return;
                                            setFinalWeight(e.target.value);
                                        }}
                                        className="w-20 text-right bg-transparent text-brand font-bold focus:outline-none placeholder-text-muted/50"
                                    />
                                    <span className="text-sm font-semibold text-text-muted">g</span>
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted ml-4 mr-4">
                            Zvaž hotové jídlo (např. těstoviny nasají vodu, maso ztratí). Prázdné = součet ingrediencí.
                        </p>
                    </div>

                    {/* Živý náhled maker */}
                    {ingredients.length > 0 && (
                        <div className="bg-surface rounded-3xl shadow-sm p-4 flex flex-col items-center gap-2">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Na 100 g</span>
                            <span className="text-4xl font-black text-brand tabular-nums leading-none">
                                {Math.round(per100(totals.calories))}
                                <span className="text-sm font-semibold text-text-muted ml-1">kcal</span>
                            </span>
                            <div className="flex gap-4 text-sm font-bold">
                                <span className="text-protein">B: {per100(totals.protein).toFixed(1)}g</span>
                                <span className="text-carbs">S: {per100(totals.carbs).toFixed(1)}g</span>
                                <span className="text-fats">T: {per100(totals.fat).toFixed(1)}g</span>
                            </div>
                            <span className="text-xs text-text-muted">
                                Celkem {totalWeight} g · {Math.round(totals.calories)} kcal
                            </span>
                        </div>
                    )}

                    {/* Porce (talíř, miska...) */}
                    <PortionsEditor portions={portions} onChange={setPortions} />

                    <button
                        type="submit"
                        disabled={isSaving || isUploading}
                        className="mt-6 bg-brand text-white font-black text-lg p-4 rounded-3xl shadow-[0_10px_30px_rgba(167,139,250,0.4)] hover:shadow-[0_10px_40px_rgba(167,139,250,0.6)] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? "Ukládám..." : isEditMode ? "Uložit změny" : "Uložit recept"}
                    </button>
                </form>
                )}
            </main>

            {/* Výběr ingredience — stejné hledání jako při logování */}
            <SearchFoodSheet
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelectFood={addIngredient}
            />
        </>
    );
}
