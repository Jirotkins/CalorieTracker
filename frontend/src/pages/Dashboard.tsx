import { CircularProgress } from "../components/ui/CircularProgress";
import { MacroOverview } from "../components/ui/MacroOverview";
import { MOCK_DAILY_NUTRITION } from "../types/nutrition";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export default function Dashboard() {
    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10">

            <ThemeToggle className="absolute top-6 right-6" />

            <header>
                <h1 className="text-2xl font-bold text-text-main">Přehled dne</h1>
            </header>
            
            {/* Hlavní kolečko pro kalorie */}
            <div className="flex justify-center my-4">
                <CircularProgress data={MOCK_DAILY_NUTRITION.calories} />
            </div>

            {/* Přehled makroživin */}
            <MacroOverview nutritionData={MOCK_DAILY_NUTRITION} />

        </main>
    );
}