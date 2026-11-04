import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, Camera, Plus, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { type Food } from "../types/food";
import { NutrientRow } from "../components/ui/NutrientRow";
import { Switch } from "../components/ui/Switch";

// Řádek porce ve formuláři (id má jen porce, která už existuje v DB)
interface PortionRow {
    key: number;
    id?: number;
    name: string;
    weight_grams: string;
}

// Unikátní klíč pro React (nové porce ještě nemají id)
let nextPortionKey = 0;

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
        photo_url: source?.photo_url || ""
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
    const [isUploading, setIsUploading] = useState(false);
    // V režimu úprav se formulář zobrazí až po načtení jídla
    const [isFoodLoaded, setIsFoodLoaded] = useState(!isEditMode);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pro sledování, zda má fotku smazat při opuštění stránky
    const uploadedPhotoUrlRef = useRef<string | null>(null);
    const isSubmittedRef = useRef(false);
    // Fotka uloženého jídla — smaže se až po úspěšném uložení nové
    const originalPhotoUrlRef = useRef<string | null>(null);

    // Stav formuláře
    const [formData, setFormData] = useState(() => toFormData(prefilledData));
    const [portions, setPortions] = useState<PortionRow[]>([]);

    // Režim úprav: načte jídlo a předvyplní formulář
    useEffect(() => {
        if (!isEditMode) return;
        api.get<Food>(`/foods/${id}`)
            .then((res) => {
                setFormData(toFormData(res.data));
                setPortions(res.data.portions.map((p) => ({
                    key: nextPortionKey++,
                    id: p.id,
                    name: p.name,
                    weight_grams: String(p.weight_grams),
                })));
                originalPhotoUrlRef.current = res.data.photo_url ?? null;
                setIsFoodLoaded(true);
            })
            .catch((error) => {
                console.error("Chyba při načítání jídla:", error);
                alert("Nepodařilo se načíst jídlo.");
                navigate(-1);
            });
    }, [id, isEditMode, navigate]);

    // Cleanup při opuštění stránky (např. tlačítko zpět)
    useEffect(() => {
        return () => {
            // Pokud fotku nahráli, ale formulář nebyl odeslán
            if (!isSubmittedRef.current && uploadedPhotoUrlRef.current) {
                api.delete("/upload", { data: { url: uploadedPhotoUrlRef.current } })
                   .catch(console.error);
            }
        };
    }, []);

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

    // Porce: přidání, úprava a odebrání řádku
    const addPortion = () => {
        setPortions([...portions, { key: nextPortionKey++, name: "", weight_grams: "" }]);
    };

    const updatePortion = (key: number, field: "name" | "weight_grams", value: string) => {
        // Váha porce - pouze celá čísla
        if (field === "weight_grams" && value !== "" && !/^\d*$/.test(value)) return;
        setPortions(portions.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
    };

    const removePortion = (key: number) => {
        setPortions(portions.filter((p) => p.key !== key));
    };

    // Handler pro výběr fotky
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Uloží si původní URL fotky, aby po úspěšném nahrání nové byla smazána
        const oldPhotoUrl = formData.photo_url;

        // Okamžitý lokální náhled (bez čekání na upload)
        const localPreview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, photo_url: localPreview }));
        setIsUploading(true);

        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            const response = await api.post("/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Smaže předchozí nahranou fotku ze serveru (fotku uloženého jídla až po uložení)
            if (oldPhotoUrl && oldPhotoUrl.startsWith("/static/photos/") && oldPhotoUrl !== originalPhotoUrlRef.current) {
                api.delete("/upload", { data: { url: oldPhotoUrl } }).catch(console.error);
            }

            const newUrl = response.data.url;
            uploadedPhotoUrlRef.current = newUrl; // Uloží pro případný cleanup při odchodu

            // Nahradí lokální preview skutečnou URL ze serveru
            setFormData(prev => ({ ...prev, photo_url: newUrl }));
        } catch (err: any) {
            console.error("Chyba při nahrávání fotky:", err);
            setFormData(prev => ({ ...prev, photo_url: oldPhotoUrl }));
            alert(err.response?.data?.detail || "Nepodařilo se nahrát fotku. Zkus to znovu.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (portions.some((p) => !(parseInt(p.weight_grams) > 0))) {
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
            photo_url: formData.photo_url || null,
            portions: portions.map((p) => ({
                id: p.id,
                name: p.name.trim(),
                weight_grams: parseInt(p.weight_grams) || 0,
            })),
        };

        try {
            if (isEditMode) {
                await api.put(`/foods/${id}`, foodValues);

                // Nová fotka je uložená → stará fotka jídla už není potřeba
                const originalPhotoUrl = originalPhotoUrlRef.current;
                if (originalPhotoUrl?.startsWith("/static/photos/") && originalPhotoUrl !== formData.photo_url) {
                    api.delete("/upload", { data: { url: originalPhotoUrl } }).catch(console.error);
                }
            } else {
                await api.post("/foods/", {
                    ...foodValues,
                    is_global: formData.is_global,
                    barcode: formData.barcode || null,
                });
            }

            // Fotka patří k uloženému jídlu → cleanup ji při odchodu nesmí smazat
            isSubmittedRef.current = true;
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
                <div className="flex justify-center mt-2">
                    {/* Skrytý file input – iOS ukáže volbu foťák/galerie */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-28 rounded-[2rem] overflow-hidden bg-surface shadow-sm border-2 border-dashed border-brand/40 flex flex-col items-center justify-center text-brand hover:bg-brand/10 active:scale-95 transition-all relative"
                    >
                        {formData.photo_url ? (
                            // Náhled fotky
                            <>
                                <img
                                    src={formData.photo_url}
                                    alt="Náhled"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay při uploadu */}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {/* Ikonka pro změnu */}
                                {!isUploading && (
                                    <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-full p-1">
                                        <Camera size={12} className="text-white" />
                                    </div>
                                )}
                            </>
                        ) : (
                            // Placeholder
                            <>
                                <Camera size={32} strokeWidth={1.5} className="mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Fotka</span>
                            </>
                        )}
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
