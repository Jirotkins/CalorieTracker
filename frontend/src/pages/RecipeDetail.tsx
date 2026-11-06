import { useNavigate, useLocation, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { api } from "../services/api"
import { type Recipe } from "../types/recipe"
import { ChevronLeft, ChefHat, MoreVertical, Pencil, Trash2, Utensils, ChevronRight } from "lucide-react"
import { ActionSheet } from "../components/ui/ActionSheet"

export default function RecipeDetail() {
    const navigate = useNavigate()
    const { id } = useParams()
    const location = useLocation()

    // Data z navigace slouží jen pro okamžité zobrazení (seznam receptů nemusí mít vše)
    const [recipe, setRecipe] = useState<Recipe | null>(location.state?.recipe ?? null)

    // Ovládá viditelnost action sheetu (3 tečky)
    const [showActions, setShowActions] = useState(false)

    // Vždy načte aktuální verzi (např. po úpravě)
    useEffect(() => {
        api.get<Recipe>(`/recipes/${id}`)
            .then((response) => setRecipe(response.data))
            .catch((error) => console.error("Chyba při načítání receptu:", error))
    }, [id])

    const handleDelete = async () => {
        if (!confirm(`Opravdu smazat recept "${recipe?.name}"?`)) return
        await api.delete(`/recipes/${recipe?.id}`)
        navigate("/foods", { state: { tab: "recipes" } })
    }

    if (!recipe || !recipe.ingredients) return <p className="text-center mt-20 text-text-muted animate-pulse">Načítám...</p>

    // Celková váha hotového jídla a jeho energie
    const rawWeight = recipe.ingredients.reduce((sum, ing) => sum + ing.amount_grams, 0)
    const totalWeight = recipe.final_weight_grams ?? rawWeight
    const totalKcal = Math.round(recipe.calories_per_100g * totalWeight / 100)

    // Konfigurace maker
    const macros = [
        { label: "Energie",    value: `${recipe.calories_per_100g} kcal`, colorClass: "text-brand" },
        { label: "Tuky",       value: `${recipe.fat_per_100g} g`,         colorClass: "text-fats" },
        { label: "→ nasycené", value: `${recipe.saturates_per_100g} g`,   colorClass: "text-saturates", sub: true },
        { label: "Sacharidy",  value: `${recipe.carbs_per_100g} g`,       colorClass: "text-carbs" },
        { label: "→ cukry",    value: `${recipe.sugar_per_100g} g`,       colorClass: "text-sugar", sub: true },
        { label: "Bílkoviny",  value: `${recipe.protein_per_100g} g`,     colorClass: "text-protein" },
        { label: "Sůl",        value: `${recipe.salt_per_100g} g`,        colorClass: "text-salt" },
    ]

    return (
        // Fragment <> protože jsou dva kořenové elementy: main + action sheet overlay
        <>
            <main className="w-full flex flex-col min-h-screen bg-surface-hover">

                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-surface sticky top-0 z-20 shadow-sm pt-[env(safe-area-inset-top,1rem)]">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand">
                        <ChevronLeft size={28} />
                    </button>
                    <h1 className="text-lg font-bold text-text-main truncate mx-2">{recipe.name}</h1>
                    {/* 3 tečky → otevře action sheet */}
                    <button type="button" onClick={() => setShowActions(true)} className="p-2 -mr-2 text-text-muted hover:text-text-main transition-colors">
                        <MoreVertical size={22} />
                    </button>
                </header>

                <div className="flex flex-col gap-6 p-4 max-w-md mx-auto w-full pb-12">

                    {/* Fotka + název + celkem */}
                    <div className="flex flex-col items-center gap-3 mt-2">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden bg-surface border border-surface-hover flex items-center justify-center shadow-sm">
                            {recipe.photo_url ? (
                                <img src={recipe.photo_url} alt={recipe.name} className="w-full h-full object-cover" />
                            ) : (
                                <ChefHat className="text-brand" size={48} strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-text-main">{recipe.name}</p>
                            <p className="text-sm text-text-muted mt-1">
                                Celkem <span className="font-bold text-text-main">{totalWeight} g</span> · <span className="font-bold text-brand">{totalKcal} kcal</span>
                                {recipe.final_weight_grams && <span> (po uvaření)</span>}
                            </p>
                        </div>
                    </div>

                    {/* Nutriční hodnoty */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider flex justify-between pr-4">
                            <span>Nutriční hodnoty</span>
                            <span className="text-brand font-black">na 100g</span>
                        </label>
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                            {macros.map((macro, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between px-4 py-3 border-b border-surface-hover/50 last:border-0 ${macro.sub ? "pl-8" : ""}`}
                                >
                                    <span className={`font-semibold text-sm ${macro.sub ? "text-text-muted" : "text-text-main"}`}>
                                        {macro.label}
                                    </span>
                                    <span className={`font-bold text-sm ${macro.colorClass}`}>{macro.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ingredience — klik vede na detail jídla */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider flex justify-between pr-4">
                            <span>Ingredience</span>
                            <span>{rawWeight} g</span>
                        </label>
                        <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                            {recipe.ingredients.map((ing) => (
                                <button
                                    key={ing.id}
                                    type="button"
                                    onClick={() => navigate(`/foods/${ing.food_id}`, { state: { food: ing.food } })}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-surface-hover/50 last:border-0 active:bg-surface-hover transition-colors text-left"
                                >
                                    <div className="w-9 h-9 shrink-0 bg-surface-hover rounded-xl flex items-center justify-center overflow-hidden">
                                        {ing.food.photo_url ? (
                                            <img src={ing.food.photo_url} alt={ing.food.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Utensils size={16} className="text-brand" />
                                        )}
                                    </div>
                                    <span className="flex-1 min-w-0 font-semibold text-sm text-text-main truncate">{ing.food.name}</span>
                                    <span className="text-sm font-bold text-brand">{ing.amount_grams} g</span>
                                    <span className="text-xs text-text-muted w-16 text-right">
                                        {Math.round(ing.food.calories_per_100g * ing.amount_grams / 100)} kcal
                                    </span>
                                    <ChevronRight size={16} className="text-text-muted" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Porce — renderuje se jen pokud nějaké existují */}
                    {recipe.portions.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Porce</label>
                            <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                                {recipe.portions.map((portion) => (
                                    <div key={portion.id} className="flex items-center justify-between px-4 py-3 border-b border-surface-hover/50 last:border-0">
                                        <span className="font-semibold text-sm text-text-main">{portion.name}</span>
                                        <span className="text-sm">
                                            <span className="font-bold text-brand">{portion.weight_grams} g</span>
                                            <span className="text-text-muted"> · {Math.round(recipe.calories_per_100g * portion.weight_grams / 100)} kcal</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            <ActionSheet isOpen={showActions} onClose={() => setShowActions(false)} title={recipe.name}>

                <button
                    onClick={() => { setShowActions(false); navigate(`/recipes/${recipe.id}/edit`) }}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                >
                    <div className="bg-surface p-3 rounded-xl shadow-sm">
                        <Pencil size={22} className="text-brand" />
                    </div>
                    <div>
                        <span className="block font-bold">Upravit recept</span>
                        <span className="block text-xs text-text-muted mt-0.5">Ingredience, váha, porce nebo fotka</span>
                    </div>
                </button>

                <button
                    onClick={handleDelete}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-red-400 hover:bg-red-400/10 transition-colors text-left"
                >
                    <div className="bg-surface p-3 rounded-xl shadow-sm">
                        <Trash2 size={22} className="text-red-400" />
                    </div>
                    <div>
                        <span className="block font-bold">Smazat recept</span>
                        <span className="block text-xs text-red-400/70 mt-0.5">Zalogované záznamy v deníčku zůstanou</span>
                    </div>
                </button>

            </ActionSheet>
        </>
    )
}
