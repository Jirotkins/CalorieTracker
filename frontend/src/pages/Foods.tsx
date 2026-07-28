import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { api } from "../services/api";
import { type Food } from "../types/food";
import { FoodCard } from "../components/ui/FoodCard";

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
            <div className="flex gap-2 bg-surface p-1 rounded-full border border-surface-hover">
                <button
                    onClick={() => setActiveTab("global")}
                    className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${activeTab === "global" ? "bg-brand text-white shadow-md" : "text-text-muted"
                        }`}
                >
                    Globální
                </button>
                <button
                    onClick={() => setActiveTab("my")}
                    className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${activeTab === "my" ? "bg-brand text-white shadow-md" : "text-text-muted"
                        }`}
                >
                    Moje jídla
                </button>

                {/* Tlačítko pro přidání nového jídla */}
                <button
                    className="bg-surface-hover text-brand p-2 aspect-square rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
                >
                    <Plus size={24} strokeWidth={2.5} />
                </button>
            </div>

            {/* Vyhledávací pole (Search bar) */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <input
                    type="text"
                    placeholder="Hledat jídlo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface py-4 pl-12 pr-4 rounded-3xl border border-surface-hover focus:outline-none focus:border-brand text-text-main transition-colors"
                />
            </div>

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
