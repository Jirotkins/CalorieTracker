import { useNavigate, useLocation, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { api } from "../services/api"
import { type Food } from "../types/food"
import { ChevronLeft, Utensils, MoreVertical, Pencil, Trash2, Tag, ShoppingBag } from "lucide-react"
import { ActionSheet } from "../components/ui/ActionSheet"

export default function FoodDetail() {
    const navigate = useNavigate()
    const { id } = useParams()
    const location = useLocation()

    const [food, setFood] = useState<Food | null>(
        location.state?.food ?? null
    )

    // Ovládá viditelnost action sheetu (3 tečky)
    const [showActions, setShowActions] = useState(false)

    useEffect(() => {
        if (food) return
        const fetchFood = async () => {
            const response = await api.get(`/foods/${id}`)
            setFood(response.data)
        }
        fetchFood()
    }, [])

    const handleDelete = async () => {
        if (!confirm(`Opravdu smazat "${food?.name}"?`)) return
        await api.delete(`/foods/${food?.id}`)
        navigate("/foods")
    }

    if (!food) return <p className="text-center mt-20 text-text-muted animate-pulse">Načítám...</p>

    // Konfigurace maker
    const macros = [
        { label: "Energie",    value: `${food.calories_per_100g} kcal`, colorClass: "text-brand" },
        { label: "Tuky",       value: `${food.fat_per_100g} g`,         colorClass: "text-fats" },
        { label: "→ nasycené", value: `${food.saturates_per_100g} g`,   colorClass: "text-saturates", sub: true },
        { label: "Sacharidy",  value: `${food.carbs_per_100g} g`,       colorClass: "text-carbs" },
        { label: "→ cukry",    value: `${food.sugar_per_100g} g`,       colorClass: "text-sugar", sub: true },
        { label: "Bílkoviny",  value: `${food.protein_per_100g} g`,     colorClass: "text-protein" },
        { label: "Sůl",        value: `${food.salt_per_100g} g`,        colorClass: "text-salt" },
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
                    <h1 className="text-lg font-bold text-text-main truncate mx-2">{food.name}</h1>
                    {/* 3 tečky → otevře action sheet */}
                    <button type="button" onClick={() => setShowActions(true)} className="p-2 -mr-2 text-text-muted hover:text-text-main transition-colors">
                        <MoreVertical size={22} />
                    </button>
                </header>

                <div className="flex flex-col gap-6 p-4 max-w-md mx-auto w-full pb-12">

                    {/* Fotka + název + čárový kód */}
                    <div className="flex flex-col items-center gap-3 mt-2">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden bg-surface border border-surface-hover flex items-center justify-center shadow-sm">
                            {food.photo_url ? (
                                <img src={food.photo_url} alt={food.name} className="w-full h-full object-cover" />
                            ) : (
                                <Utensils className="text-brand" size={48} strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-text-main">{food.name}</p>
                            {/* food.barcode je optional — zobrazíme jen pokud existuje */}
                            {food.barcode && (
                                <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1">
                                    <Tag size={11} /> {food.barcode}
                                </p>
                            )}
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

                    {/* Obchody — renderuje se jen pokud food.stores není prázdné */}
                    {food.stores.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Dostupné v</label>
                            <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                                {food.stores.map((store) => (
                                    <div key={store.id} className="flex items-center gap-3 px-4 py-3 border-b border-surface-hover/50 last:border-0">
                                        <ShoppingBag size={16} className="text-brand shrink-0" />
                                        <span className="font-semibold text-text-main">{store.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            <ActionSheet isOpen={showActions} onClose={() => setShowActions(false)} title={food.name}>

                <button
                    onClick={() => { setShowActions(false); navigate(`/foods/${food.id}/edit`) }}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                >
                    <div className="bg-surface p-3 rounded-xl shadow-sm">
                        <Pencil size={22} className="text-brand" />
                    </div>
                    <div>
                        <span className="block font-bold">Upravit jídlo</span>
                        <span className="block text-xs text-text-muted mt-0.5">Změnit název, makra nebo fotku</span>
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
                        <span className="block font-bold">Smazat jídlo</span>
                        <span className="block text-xs text-red-400/70 mt-0.5">Tato akce je nevratná</span>
                    </div>
                </button>

            </ActionSheet>
        </>
    )
}