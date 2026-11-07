import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CircularProgress } from "../components/ui/CircularProgress";
import { MacroOverview } from "../components/ui/MacroOverview";
import { DailyMealLog } from "../components/ui/DailyMealLog";
import { DateStepper } from "../components/ui/DateStepper";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { useDailySummary } from "../hooks/useDailySummary";
import { type DailyNutrition } from "../types/nutrition";
import { type DailySummary } from "../types/meal";
import { parseLocalDate } from "../utils/date";

// Adaptér: převede DailySummary z API na formát který čekají komponenty CircularProgress a MacroOverview
function toNutritionData(summary: DailySummary): DailyNutrition {
    return {
        calories:  { consumed: summary.total_calories,   goal: summary.goal_calories },
        fats:      { consumed: summary.total_fat,        goal: summary.goal_fat },
        saturates: { consumed: summary.total_saturates,  goal: summary.goal_saturates },
        carbs:     { consumed: summary.total_carbs,      goal: summary.goal_carbs },
        sugar:     { consumed: summary.total_sugar,      goal: summary.goal_sugar },
        protein:   { consumed: summary.total_protein,    goal: summary.goal_protein },
        salt:      { consumed: summary.total_salt,       goal: summary.goal_salt },
    }
}

export default function Dashboard() {
    // ?date=YYYY-MM-DD otevře konkrétní den (např. proklik ze statistik)
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedDate, setSelectedDate] = useState<Date>(() => parseLocalDate(searchParams.get("date")) ?? new Date());

    // Parametr se použije jen jednou → po obnovení stránky se ukáže zase dnešek
    useEffect(() => {
        if (searchParams.has("date")) setSearchParams({}, { replace: true });
    }, [searchParams, setSearchParams]);
    // Zvýšení refreshKey vynutí nový fetch v useDailySummary bez změny data
    const [refreshKey, setRefreshKey] = useState(0);
    const { user } = useAuth();
    const { data, isLoading, error } = useDailySummary(selectedDate, refreshKey);

    const handleLogAdded = () => setRefreshKey((prev) => prev + 1);

    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10">

            <header className="flex flex-col items-center gap-1">
                <h1 className="text-2xl font-bold text-text-main">Vítej, {user?.username}</h1>
                <p className="text-text-muted font-medium">Přehled dne</p>
            </header>

            <DateStepper date={selectedDate} onChange={setSelectedDate} />

            {/* Skeleton jen při změně dne — po zalogování zůstanou vidět stará data, než přijdou nová */}
            {isLoading && !data && (
                <>
                    <div className="flex justify-center my-4">
                        <Skeleton className="w-[200px] h-[200px] rounded-full" />
                    </div>
                    <Skeleton className="h-56 rounded-3xl" />
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-3xl mt-4" />)}
                </>
            )}
            {error && (
                <p className="text-center text-red-400 py-10">{error}</p>
            )}

            {/* Reálná data z API */}
            {data && (
                <>
                    {/* Hlavní kolečko pro kalorie */}
                    <div className="flex justify-center my-4">
                        <CircularProgress data={toNutritionData(data).calories} />
                    </div>

                    {/* Přehled makroživin */}
                    <MacroOverview nutritionData={toNutritionData(data)} />

                    {/* Přehled záznamů pro jeden den */}
                    <DailyMealLog
                        mealsData={data.meal_groups}
                        selectedDate={selectedDate}
                        onLogAdded={handleLogAdded}
                    />
                </>
            )}

        </main>
    );
}