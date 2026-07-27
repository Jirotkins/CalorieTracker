import { useState } from "react";
import { CircularProgress } from "../components/ui/CircularProgress";
import { MacroOverview } from "../components/ui/MacroOverview";
import { DailyMealLog } from "../components/ui/DailyMealLog";
import { DateStepper } from "../components/ui/DateStepper";
import { useAuth } from "../hooks/useAuth";

import { MOCK_DAILY_NUTRITION } from "../types/nutrition";
import { MOCK_DAILY_MEALS } from "../types/meal";

export default function Dashboard() {
    // Stav aktuálně zobrazeného dne, výchozí je dnešek
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const { user } = useAuth();

    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10">

            <header className="flex flex-col items-center gap-1">
                <h1 className="text-2xl font-bold text-text-main">Vítej, {user?.username}</h1>
                <p className="text-text-muted font-medium">Přehled dne</p>
            </header>

            <DateStepper date={selectedDate} onChange={setSelectedDate} />

            {/* Hlavní kolečko pro kalorie */}
            <div className="flex justify-center my-4">
                <CircularProgress data={MOCK_DAILY_NUTRITION.calories} />
            </div>

            {/* Přehled makroživin */}
            <MacroOverview nutritionData={MOCK_DAILY_NUTRITION} />

            {/* Přehled záznamů pro jeden den */}
            <DailyMealLog mealsData={MOCK_DAILY_MEALS} />

        </main>
    );
}