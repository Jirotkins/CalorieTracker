import { CircularProgress } from "../components/ui/CircularProgress";
import { MacroOverview } from "../components/ui/MacroOverview";
import { MOCK_DAILY_NUTRITION } from "../types/nutrition";
import { ThemeToggle } from "../components/ui/ThemeToggle";

import { FoodLogItem } from "../components/ui/FoodLogItem";
import { MealSection } from "../components/ui/MealSection";

export default function Dashboard() {
    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10">

            <ThemeToggle className="absolute top-6 right-6" />

            <header className="flex justify-center">
                <h1 className="text-2xl font-bold text-text-main">Přehled dne</h1>
            </header>
            
            {/* Hlavní kolečko pro kalorie */}
            <div className="flex justify-center my-4">
                <CircularProgress data={MOCK_DAILY_NUTRITION.calories} />
            </div>

            {/* Přehled makroživin */}
            <MacroOverview nutritionData={MOCK_DAILY_NUTRITION} />

            {/* Jídelníček - Snídaně */}
            <MealSection title="Snídaně" totalCalories={355}>
                <FoodLogItem 
                    name="Ovesná kaše s proteinem a ovocem" 
                    grams={60} 
                    calories={250} 
                />
                <FoodLogItem 
                    name="Banán" 
                    grams={120} 
                    calories={105} 
                />
            </MealSection>
            {/* Jídelníček - Oběd */}
            <MealSection title="Oběd" totalCalories={1048}>
                <FoodLogItem 
                    name="Hovězí burger s bulkou" 
                    grams={300} 
                    calories={1048} 
                />
            </MealSection>
            {/* Jídelníček - Svačina (Zatím prázdná) */}
            <MealSection title="Svačina" totalCalories={0}>
                <div className="p-4 text-center text-sm text-text-muted">
                    Zatím jsi nepřidal žádné jídlo.
                </div>
            </MealSection>

        </main>
    );
}