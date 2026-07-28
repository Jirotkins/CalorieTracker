import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Camera } from "lucide-react";
import { api } from "../services/api";
import { NutrientRow } from "../components/ui/NutrientRow";
import { Switch } from "../components/ui/Switch";

export default function AddFood() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Stav formuláře (všechny položky jako prázdné stringy, ať je input čistý)
    const [formData, setFormData] = useState({
        name: "",
        is_global: true,
        calories_per_100g: "",
        fat_per_100g: "",
        saturates_per_100g: "",
        carbs_per_100g: "",
        sugar_per_100g: "",
        protein_per_100g: "",
        salt_per_100g: ""
    });

    // Univerzální handler pro změnu inputů
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Název jídla
        if (name === "name") {
            setFormData({ ...formData, [name]: value });
            return;
        }

        // Kalorie - pouze celá čísla
        if (name === "calories_per_100g") {
            if (value !== "" && !/^\d*$/.test(value)) return;
            setFormData({ ...formData, [name]: value });
            return;
        }

        // Makra - čísla s desetinou čárkou/tečkou
        const parsedValue = value.replace(',', '.');
        if (parsedValue !== "" && !/^\d*\.?\d*$/.test(parsedValue)) return;

        setFormData({ ...formData, [name]: parsedValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post("/foods/", {
                name: formData.name,
                is_global: formData.is_global,
                calories_per_100g: parseInt(formData.calories_per_100g) || 0,
                fat_per_100g: parseFloat(formData.fat_per_100g) || 0,
                saturates_per_100g: parseFloat(formData.saturates_per_100g) || 0,
                carbs_per_100g: parseFloat(formData.carbs_per_100g) || 0,
                sugar_per_100g: parseFloat(formData.sugar_per_100g) || 0,
                protein_per_100g: parseFloat(formData.protein_per_100g) || 0,
                salt_per_100g: parseFloat(formData.salt_per_100g) || 0,
            });

            navigate("/foods");
        } catch (error) {
            console.error("Chyba při ukládání jídla:", error);
            alert("Nepodařilo se uložit jídlo.");
        } finally {
            setIsLoading(false);
        }
    };

    // Konfigurace maker pro automatické vykreslení
    const nutrients = [
        { label: "Energie (kcal)", name: "calories_per_100g", colorClass: "text-brand" },
        { label: "Tuky (g)", name: "fat_per_100g", colorClass: "text-fats" },
        { label: "z toho nasycené", name: "saturates_per_100g", colorClass: "text-saturates", isSubItem: true },
        { label: "Sacharidy (g)", name: "carbs_per_100g", colorClass: "text-carbs" },
        { label: "z toho cukry", name: "sugar_per_100g", colorClass: "text-sugar", isSubItem: true },
        { label: "Bílkoviny (g)", name: "protein_per_100g", colorClass: "text-protein" },
        { label: "Sůl (g)", name: "salt_per_100g", colorClass: "text-salt" },
    ];

    return (
        <main className="w-full flex flex-col min-h-screen bg-surface-hover">
            <header className="flex items-center justify-between p-4 bg-surface sticky top-0 z-20 shadow-sm pt-[env(safe-area-inset-top,1rem)]">
                <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand">
                    <ChevronLeft size={28} />
                </button>
                <h1 className="text-lg font-bold text-text-main">Nové jídlo</h1>
                <div className="w-10" />
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 pb-12 max-w-md mx-auto w-full">

                {/* Přidání fotky */}
                <div className="flex justify-center mt-2">
                    <button
                        type="button"
                        onClick={() => alert("Nahrávání fotek brzy přidáme!")}
                        className="w-28 h-28 rounded-[2rem] bg-surface shadow-sm border-2 border-dashed border-brand/40 flex flex-col items-center justify-center text-brand hover:bg-brand/10 active:scale-95 transition-all"
                    >
                        <Camera size={32} strokeWidth={1.5} className="mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Fotka</span>
                    </button>
                </div>

                {/* Základní informace */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Základní</label>
                    <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
                            <span className="font-semibold text-text-main shrink-0 w-24">Název</span>
                            <input
                                required
                                type="text"
                                name="name"
                                placeholder="Např. Ovesná kaše"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full text-right bg-transparent text-text-main font-semibold focus:outline-none placeholder-text-muted/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Sekce makra - přesně jako na zadní straně obalu */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider flex justify-between pr-4">
                        <span>Nutriční hodnoty</span>
                        <span className="text-brand font-black">na 100g</span>
                    </label>

                    <div className="flex flex-col bg-surface rounded-3xl overflow-hidden shadow-sm">
                        {nutrients.map((nutrient) => (
                            <NutrientRow
                                key={nutrient.name}
                                label={nutrient.label}
                                name={nutrient.name}
                                value={formData[nutrient.name as keyof typeof formData] as string}
                                colorClass={nutrient.colorClass}
                                isSubItem={nutrient.isSubItem}
                                onChange={handleChange}
                            />
                        ))}
                    </div>
                </div>

                {/* Viditelnost */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-muted ml-4 uppercase tracking-wider">Viditelnost</label>
                    <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex flex-col">
                                <span className="font-semibold text-text-main">Sdílet s ostatními</span>
                                <span className="text-xs text-text-muted mt-0.5">Uložit do globální databáze</span>
                            </div>
                            <Switch
                                checked={formData.is_global}
                                onChange={() => setFormData({ ...formData, is_global: !formData.is_global })}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-6 bg-brand text-white font-black text-lg p-4 rounded-3xl shadow-[0_10px_30px_rgba(167,139,250,0.4)] hover:shadow-[0_10px_40px_rgba(167,139,250,0.6)] active:scale-95 transition-all disabled:opacity-50"
                >
                    {isLoading ? "Ukládám..." : "Uložit jídlo"}
                </button>
            </form>
        </main>
    );
}
