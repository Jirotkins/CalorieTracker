import { useState, useEffect } from "react";
import { api } from "../services/api";
import { type Food } from "../types/food";
import { FoodCard } from "../components/ui/FoodCard";
import { AddFoodMenu } from "../components/ui/AddFoodMenu";
import { SearchBar } from "../components/ui/SearchBar";
import { Tabs } from "../components/ui/Tabs";

type Tab = "global" | "my";

export default function Foods() {
    const [activeTab, setActiveTab] = useState<Tab>("global");
    const [searchQuery, setSearchQuery] = useState("");
    const [foods, setFoods] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Získá data z API podle toho, v jaké je uživatel záložce a co je napsáno v hledání
    useEffect(() => {
        const fetchFoods = async () => {
            setIsLoading(true);
            try {
                // Vybere správný backend endpoint
                const endpoint = activeTab === "global" ? "/foods/" : "/foods/me";

                // Přibalí vyhledávací text, pokud nějaký je
                const params = searchQuery ? { search: searchQuery } : {};

                const response = await api.get(endpoint, { params });
                setFoods(response.data);
            } catch (error) {
                console.error("Chyba při načítání jídel:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Zpoždění 300ms po dopsání písmena
        const delayTimer = setTimeout(() => {
            fetchFoods();
        }, 300);

        return () => clearTimeout(delayTimer);
    }, [activeTab, searchQuery]);

    return (
        <main className="w-full p-4 flex flex-col gap-6 max-w-md mx-auto mt-4 pb-24">

            {/* Přepínač (Tabs) + Tlačítko Přidat */}
            <div className="flex gap-2 items-center">
                <Tabs
                    options={[
                        { id: "global", label: "Globální" },
                        { id: "my", label: "Moje jídla" }
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
                placeholder="Hledat jídlo..."
            />

            {/* Výpis načtených jídel */}
            <div className="flex flex-col gap-3">
                {isLoading ? (
                    <p className="text-center text-text-muted mt-10 animate-pulse">Načítám z databáze...</p>
                ) : foods.length === 0 ? (
                    <div className="text-center mt-10 bg-surface border border-surface-hover p-6 rounded-3xl">
                        <p className="text-text-main font-medium">Nic jsme nenašli</p>
                        <p className="text-text-muted text-sm mt-1">Zkus hledat něco jiného nebo přidej nové jídlo.</p>
                    </div>
                ) : (
                    foods.map(food => (
                        <FoodCard key={food.id} food={food} />
                    ))
                )}
            </div>
        </main>
    );
}
