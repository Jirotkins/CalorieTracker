import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { type Food } from "../types/food";
import { type Recipe } from "../types/recipe";
import { FoodCard } from "../components/ui/FoodCard";
import { AddFoodMenu } from "../components/ui/AddFoodMenu";
import { SearchBar } from "../components/ui/SearchBar";
import { Tabs } from "../components/ui/Tabs";
import { CardListSkeleton } from "../components/ui/Skeleton";

type Tab = "global" | "my" | "recipes";

// Endpoint pro každou záložku
const TAB_ENDPOINTS: Record<Tab, string> = {
    global: "/foods/",
    my: "/foods/me",
    recipes: "/recipes/",
};

export default function Foods() {
    const location = useLocation();
    // Po uložení/smazání receptu se vrací rovnou na záložku Recepty
    const [activeTab, setActiveTab] = useState<Tab>(location.state?.tab ?? "global");
    const [searchQuery, setSearchQuery] = useState("");
    // Poslední načtený seznam + záložka, ke které patří (jiná záložka = zatím nic k zobrazení)
    const [result, setResult] = useState<{ tab: Tab; items: (Food | Recipe)[] } | null>(null);
    // Od začátku true → hned skeleton, ne "Nic jsme nenašli"
    const [isLoading, setIsLoading] = useState(true);

    // Získá data z API podle toho, v jaké je uživatel záložce a co je napsáno v hledání
    useEffect(() => {
        // Odpověď na už neaktuální záložku/hledání (rychlé přepínání, psaní) se zahodí
        let isCancelled = false;
        setIsLoading(true);

        const fetchFoods = async () => {
            try {
                // Přibalí vyhledávací text, pokud nějaký je
                const params = searchQuery ? { search: searchQuery } : {};

                const response = await api.get(TAB_ENDPOINTS[activeTab], { params });
                if (!isCancelled) setResult({ tab: activeTab, items: response.data });
            } catch (error) {
                console.error("Chyba při načítání jídel:", error);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        // Zpoždění 300ms jen při psaní do hledání (otevření stránky a přepnutí záložky hned)
        const delayTimer = setTimeout(fetchFoods, searchQuery ? 300 : 0);

        return () => {
            isCancelled = true;
            clearTimeout(delayTimer);
        };
    }, [activeTab, searchQuery]);

    // Při psaní zůstane vidět předchozí výsledek aktuální záložky, dokud nepřijde nový
    const items = result?.tab === activeTab ? result.items : null;

    return (
        <main className="w-full p-4 flex flex-col gap-6 max-w-md mx-auto mt-4 pb-24">

            {/* Přepínač (Tabs) + Tlačítko Přidat */}
            <div className="flex gap-2 items-center">
                <Tabs
                    options={[
                        { id: "global", label: "Globální" },
                        { id: "my", label: "Moje" },
                        { id: "recipes", label: "Recepty" }
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as Tab)}
                />

                <AddFoodMenu />
            </div>

            {/* Vyhledávací pole (Search bar) */}
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={activeTab === "recipes" ? "Hledat recept..." : "Hledat jídlo..."}
            />

            {/* Výpis načtených jídel */}
            <div className="flex flex-col gap-3">
                {items === null || (isLoading && items.length === 0) ? (
                    <CardListSkeleton />
                ) : items.length === 0 ? (
                    <div className="text-center mt-10 bg-surface border border-surface-hover p-6 rounded-3xl">
                        <p className="text-text-main font-medium">Nic jsme nenašli</p>
                        <p className="text-text-muted text-sm mt-1">
                            {activeTab === "recipes"
                                ? "Zkus hledat něco jiného nebo vytvoř nový recept přes +."
                                : "Zkus hledat něco jiného nebo přidej nové jídlo."}
                        </p>
                    </div>
                ) : activeTab === "recipes" ? (
                    (items as Recipe[]).map(recipe => (
                        <FoodCard key={recipe.id} food={recipe} to={`/recipes/${recipe.id}`} isRecipe />
                    ))
                ) : (
                    (items as Food[]).map(food => (
                        <FoodCard key={food.id} food={food} to={`/foods/${food.id}`} />
                    ))
                )}
            </div>
        </main>
    );
}
