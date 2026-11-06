import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "../services/api";
import { type Food } from "../types/food";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { NutrientRow } from "../components/ui/NutrientRow";
import { Switch } from "../components/ui/Switch";
import { PhotoPicker } from "../components/ui/PhotoPicker";
import { PortionsEditor } from "../components/ui/PortionsEditor";
import { type PortionRow, toPortionRows, toPortionPayload, hasInvalidPortion } from "../utils/portions";

// Převede jídlo (z API, Open Food Facts nebo jen s čárovým kódem) na hodnoty formuláře.
// Chybějící nutriční hodnoty začínají na "0" — při psaní se 0 sama přepíše (viz NutrientRow).
function toFormData(source?: Partial<Food>) {
    return {
        name: source?.name || "",
        is_global: true,
        calories_per_100g: source?.calories_per_100g?.toString() ?? "0",
        fat_per_100g: source?.fat_per_100g?.toString() ?? "0",
        saturates_per_100g: source?.saturates_per_100g?.toString() ?? "0",
        carbs_per_100g: source?.carbs_per_100g?.toString() ?? "0",
        sugar_per_100g: source?.sugar_per_100g?.toString() ?? "0",
        protein_per_100g: source?.protein_per_100g?.toString() ?? "0",
        salt_per_100g: source?.salt_per_100g?.toString() ?? "0",
        barcode: source?.barcode || "",
    };
}

// Stránka pro přidání nového jídla (/foods/new) i úpravu existujícího (/foods/:id/edit)
export default function AddFood() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isEditMode = !!id;
    const prefilledData = location.state?.prefilledData;
    const [isLoading, setIsLoading] = useState(false);
    // V režimu úprav se formulář zobrazí až po načtení jídla
    const [isFoodLoaded, setIsFoodLoaded] = useState(!isEditMode);
    // Fotka (OFF fotka ze skeneru je jen externí odkaz)
    const { photoUrl, isUploading, uploadPhoto, setOriginalPhoto, commitPhoto } = usePhotoUpload(prefilledData?.photo_url || "");

    // Stav formuláře
    const [formData, setFormData] = useState(() => toFormData(prefilledData));
    const [portions, setPortions] = useState<PortionRow[]>([]);

    // Režim úprav: načte jídlo a předvyplní formulář
    useEffect(() => {
        if (!isEditMode) return;
        api.get<Food>(`/foods/${id}`)
            .then((res) => {
                setFormData(toFormData(res.data));
                setPortions(toPortionRows(res.data.portions));
                setOriginalPhoto(res.data.photo_url);
                setIsFoodLoaded(true);
            })
            .catch((error) => {
                console.error("Chyba při načítání jídla:", error);
                alert("Nepodařilo se načíst jídlo.");
                navigate(-1);
            });
    }, [id, isEditMode, navigate, setOriginalPhoto]);

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
        if (hasInvalidPortion(portions)) {
            alert("Váha porce musí být větší než 0 g.");
            return;
        }
        setIsLoading(true);

        const foodValues = {
            name: formData.name,
            calories_per_100g: parseInt(formData.calories_per_100g) || 0,
            fat_per_100g: parseFloat(formData.fat_per_100g) || 0,
            saturates_per_100g: parseFloat(formData.saturates_per_100g) || 0,
            carbs_per_100g: parseFloat(formData.carbs_per_100g) || 0,
            sugar_per_100g: parseFloat(formData.sugar_per_100g) || 0,
            protein_per_100g: parseFloat(formData.protein_per_100g) || 0,
            salt_per_100g: parseFloat(formData.salt_per_100g) || 0,
            photo_url: photoUrl || null,
            portions: toPortionPayload(portions),
        };

        try {
            if (isEditMode) {
                await api.put(`/foods/${id}`, foodValues);
            } else {
                await api.post("/foods/", {
                    ...foodValues,
                    is_global: formData.is_global,
                    barcode: formData.barcode || null,
                });
            }

            // Fotka patří k uloženému jídlu (a případná stará se smaže)
            commitPhoto();
            if (isEditMode) {
                navigate(-1);
            } else {
                navigate("/foods");
            }
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
                <h1 className="text-lg font-bold text-text-main">{isEditMode ? "Upravit jídlo" : "Nové jídlo"}</h1>
                <div className="w-10" />
            </header>

            {!isFoodLoaded ? (
                <p className="text-center mt-20 text-text-muted animate-pulse">Načítám...</p>
            ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 pb-12 max-w-md mx-auto w-full">

                {/* Přidání fotky */}
                <PhotoPicker photoUrl={photoUrl} isUploading={isUploading} onSelectFile={uploadPhoto} />

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
                        {/* Čárový kód (ze skeneru) — jen pro informaci */}
                        {formData.barcode && (
                            <div className="flex items-center justify-between p-4 border-t border-surface-hover">
                                <span className="font-semibold text-text-main shrink-0 w-24">Kód</span>
                                <span className="text-text-muted font-semibold tabular-nums">{formData.barcode}</span>
                            </div>
                        )}
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

                {/* Porce (kus, balení...) */}
                <PortionsEditor portions={portions} onChange={setPortions} />

                {/* Viditelnost (jen u nového jídla — u existujícího se nemění) */}
                {!isEditMode && (
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
                )}

                <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="mt-6 bg-brand text-white font-black text-lg p-4 rounded-3xl shadow-[0_10px_30px_rgba(167,139,250,0.4)] hover:shadow-[0_10px_40px_rgba(167,139,250,0.6)] active:scale-95 transition-all disabled:opacity-50"
                >
                    {isLoading ? "Ukládám..." : isEditMode ? "Uložit změny" : "Uložit jídlo"}
                </button>
            </form>
            )}
        </main>
    );
}
