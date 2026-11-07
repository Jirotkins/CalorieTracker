import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { type StatsResponse, type DayStats } from "../types/stats";
import { Tabs } from "../components/ui/Tabs";
import { CaloriesBarChart } from "../components/ui/CaloriesBarChart";
import { toLocalDateString, parseLocalDate, addDays, startOfWeek } from "../utils/date";
import { formatAmount } from "../utils/number";

type Period = "week" | "month";

// Makra v přehledu průměrů (pořadí jako na dashboardu)
const MACROS = [
    { key: "protein", label: "Bílkoviny", colorClass: "bg-protein" },
    { key: "carbs", label: "Sacharidy", colorClass: "bg-carbs" },
    { key: "fat", label: "Tuky", colorClass: "bg-fats" },
    { key: "sugar", label: "Cukry", colorClass: "bg-sugar" },
    { key: "saturates", label: "Nasycené tuky", colorClass: "bg-saturates" },
    { key: "salt", label: "Sůl", colorClass: "bg-salt" },
] as const;

const DAY_FORMAT = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" });
const MONTH_FORMAT = new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" });

// Rozsah období, do kterého patří kotevní datum
function getRange(period: Period, anchor: Date): { start: Date; end: Date } {
    if (period === "week") {
        const start = startOfWeek(anchor);
        return { start, end: addDays(start, 6) };
    }
    return {
        start: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
        end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
    };
}

// Popisek období: "Tento týden", "3. 11. – 9. 11.", "listopad 2026"
function formatRange(period: Period, start: Date, end: Date): string {
    if (period === "month") {
        const label = MONTH_FORMAT.format(start);
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
    if (toLocalDateString(start) === toLocalDateString(startOfWeek(new Date()))) return "Tento týden";
    return `${start.getDate()}. ${start.getMonth() + 1}. – ${end.getDate()}. ${end.getMonth() + 1}.`;
}

function formatDay(day: string): string {
    const label = DAY_FORMAT.format(parseLocalDate(day)!);
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Stats() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<Period>("week");
    // Libovolné datum uvnitř zobrazeného období (posouvá se šipkami)
    const [anchor, setAnchor] = useState(() => new Date());
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const { start, end } = getRange(period, anchor);
    const startStr = toLocalDateString(start);
    const endStr = toLocalDateString(end);
    // Do budoucnosti posouvat nejde
    const isCurrentPeriod = toLocalDateString(new Date()) <= endStr;

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        setSelectedDay(null);
        api.get<StatsResponse>("/logs/stats", { params: { start: startStr, end: endStr } })
            .then((res) => setStats(res.data))
            .catch(() => setError("Nepodařilo se načíst statistiky."))
            .finally(() => setIsLoading(false));
    }, [startStr, endStr]);

    const shiftPeriod = (direction: -1 | 1) => {
        setAnchor(period === "week"
            ? addDays(anchor, 7 * direction)
            : new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
    };

    // Průměry jen ze dní se zápisem (prázdné dny by průměr stáhly k nule)
    const loggedDays = stats?.days.filter((d) => d.log_count > 0) ?? [];
    const average = (key: keyof Omit<DayStats, "day" | "log_count">) =>
        loggedDays.length > 0 ? loggedDays.reduce((sum, d) => sum + d[key], 0) / loggedDays.length : 0;
    const avgCalories = Math.round(average("calories"));
    const daysInGoal = stats ? loggedDays.filter((d) => d.calories <= stats.goal_calories).length : 0;
    const selected = stats?.days.find((d) => d.day === selectedDay) ?? null;

    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10 mt-4">
            <header className="flex flex-col items-center gap-1">
                <h1 className="text-2xl font-bold text-text-main">Statistiky</h1>
                <p className="text-text-muted font-medium">Jak se ti daří v čase</p>
            </header>

            {/* Týden / Měsíc */}
            <div className="flex">
                <Tabs<Period>
                    options={[
                        { id: "week", label: "Týden" },
                        { id: "month", label: "Měsíc" },
                    ]}
                    activeTab={period}
                    onChange={setPeriod}
                />
            </div>

            {/* Posun období */}
            <div className="flex items-center justify-between bg-surface rounded-full shadow-sm border border-surface-hover w-full max-w-xs mx-auto -mt-2">
                <button
                    onClick={() => shiftPeriod(-1)}
                    className="p-3 text-text-muted hover:text-brand active:scale-90 transition-all rounded-full"
                    aria-label="Předchozí období"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="text-sm font-bold text-text-main">{formatRange(period, start, end)}</span>
                <button
                    onClick={() => shiftPeriod(1)}
                    disabled={isCurrentPeriod}
                    className="p-3 text-text-muted hover:text-brand active:scale-90 transition-all rounded-full disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Následující období"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {isLoading && (
                <p className="text-center text-text-muted animate-pulse py-10">Načítám statistiky...</p>
            )}
            {error && (
                <p className="text-center text-red-400 py-10">{error}</p>
            )}

            {stats && !isLoading && (
                <>
                    {/* Graf kalorií */}
                    <section className="bg-surface rounded-3xl shadow-xl p-4 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between">
                            <h2 className="text-base font-bold text-text-main">Kalorie</h2>
                            {/* Legenda — barva sloupce říká, jestli byl den nad cílem */}
                            <div className="flex gap-3 text-[11px] font-semibold text-text-muted">
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand" />v cíli</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />nad cílem</span>
                            </div>
                        </div>

                        {/* Detail vybraného dne (pevná výška, aby graf neposkakoval) */}
                        <div className="h-11 flex items-center justify-between bg-surface-hover rounded-2xl px-3">
                            {selected ? (
                                <>
                                    <span className="text-sm text-text-main">
                                        <span className="font-bold">{formatDay(selected.day)}</span>
                                        <span className="text-text-muted"> · </span>
                                        {selected.log_count > 0 ? (
                                            <>
                                                <span className="font-bold tabular-nums">{selected.calories} kcal</span>
                                                <span className="text-text-muted"> ({Math.round(selected.calories / stats.goal_calories * 100)} % cíle)</span>
                                            </>
                                        ) : (
                                            <span className="text-text-muted">bez zápisu</span>
                                        )}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/dashboard?date=${selected.day}`)}
                                        className="flex items-center gap-1 text-sm font-bold text-brand active:scale-95 transition-transform"
                                    >
                                        Otevřít <ArrowRight size={16} />
                                    </button>
                                </>
                            ) : (
                                <span className="text-sm text-text-muted w-full text-center">Klepni na den v grafu</span>
                            )}
                        </div>

                        <CaloriesBarChart
                            days={stats.days}
                            goal={stats.goal_calories}
                            selectedDay={selectedDay}
                            onSelectDay={(day) => setSelectedDay(day === selectedDay ? null : day)}
                        />
                    </section>

                    {/* Souhrnné dlaždice */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface rounded-3xl shadow-xl p-4 flex flex-col">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Průměr / den</span>
                            <span className="text-3xl font-black text-text-main tabular-nums mt-1">
                                {avgCalories}
                                <span className="text-sm font-semibold text-text-muted ml-1">kcal</span>
                            </span>
                            <span className="text-xs text-text-muted mt-0.5">cíl {stats.goal_calories} kcal</span>
                        </div>
                        <div className="bg-surface rounded-3xl shadow-xl p-4 flex flex-col">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Dní v cíli</span>
                            <span className="text-3xl font-black text-text-main tabular-nums mt-1">
                                {daysInGoal}
                                <span className="text-sm font-semibold text-text-muted ml-1">/ {loggedDays.length}</span>
                            </span>
                            <span className="text-xs text-text-muted mt-0.5">ze dní se zápisem</span>
                        </div>
                    </div>

                    {/* Průměrná makra vs. cíl */}
                    <section className="bg-surface rounded-3xl shadow-xl p-4 flex flex-col gap-4">
                        <div className="flex items-baseline justify-between">
                            <h2 className="text-base font-bold text-text-main">Průměrná makra</h2>
                            <span className="text-xs text-text-muted">průměr / cíl na den</span>
                        </div>
                        {MACROS.map((macro) => {
                            const avg = average(macro.key);
                            const goal = stats[`goal_${macro.key}`];
                            const percent = goal > 0 ? (avg / goal) * 100 : 0;
                            return (
                                <div key={macro.key} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-text-main">{macro.label}</span>
                                        <span className="tabular-nums">
                                            <span className="font-bold text-text-main">{formatAmount(avg)} g</span>
                                            <span className="text-text-muted"> / {formatAmount(goal)} g</span>
                                        </span>
                                    </div>
                                    <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${macro.colorClass}`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {loggedDays.length === 0 && (
                            <p className="text-sm text-text-muted text-center">V tomto období zatím nemáš žádný zápis.</p>
                        )}
                    </section>
                </>
            )}
        </main>
    );
}
