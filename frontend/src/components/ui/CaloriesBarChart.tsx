import { type DayStats } from "../../types/stats";
import { parseLocalDate, toLocalDateString } from "../../utils/date";

interface Props {
    days: DayStats[];
    goal: number;
    selectedDay: string | null;
    onSelectDay: (day: string) => void;
}

// Rozměry viewBoxu — SVG se škáluje na šířku karty (text se zvětšuje rovnoměrně)
const WIDTH = 340;
const HEIGHT = 190;
const PADDING = { top: 12, right: 4, bottom: 22, left: 4 };
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const BASELINE = PADDING.top + INNER_HEIGHT;
// Mezera mezi sloupci a max. šířka sloupce (u týdne by byly zbytečně široké)
const BAR_GAP = 2;
const MAX_BAR_WIDTH = 28;
const CORNER_RADIUS = 4;

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("cs-CZ", { weekday: "short" });

// Sloupec se zaobleným jen horním koncem, ukotvený na základnu
function barPath(x: number, top: number, width: number, height: number): string {
    const r = Math.min(CORNER_RADIUS, width / 2, height);
    return `M${x},${BASELINE} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${BASELINE} Z`;
}

// Popisek osy X: u týdne den v týdnu, u měsíce jen každý 5. den (a 1.)
function axisLabel(day: Date, isWeek: boolean): string | null {
    if (isWeek) return WEEKDAY_FORMAT.format(day);
    const dayOfMonth = day.getDate();
    return dayOfMonth === 1 || dayOfMonth % 5 === 0 ? String(dayOfMonth) : null;
}

// Sloupcový graf kalorií po dnech s čárou denního cíle
export function CaloriesBarChart({ days, goal, selectedDay, onSelectDay }: Props) {
    const isWeek = days.length <= 7;
    const today = toLocalDateString(new Date());

    // Osa Y: cíl musí být vždy vidět, nahoře rezerva
    const maxCalories = Math.max(...days.map((d) => d.calories), 0);
    const maxValue = Math.max(goal * 1.15, maxCalories * 1.05, 1);
    const yFor = (value: number) => BASELINE - (value / maxValue) * INNER_HEIGHT;
    const goalY = yFor(goal);

    const slotWidth = INNER_WIDTH / days.length;
    const barWidth = Math.min(slotWidth - BAR_GAP, MAX_BAR_WIDTH);

    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label={`Kalorie po dnech, denní cíl ${goal} kcal`}
        >
            {/* Základna */}
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={BASELINE} y2={BASELINE} className="stroke-text-muted/30" strokeWidth={1} />

            {days.map((d, i) => {
                const date = parseLocalDate(d.day)!;
                const slotX = PADDING.left + i * slotWidth;
                const barX = slotX + (slotWidth - barWidth) / 2;
                const barTop = yFor(d.calories);
                const isSelected = d.day === selectedDay;
                const isDimmed = selectedDay !== null && !isSelected;
                const isOver = d.calories > goal;
                const label = axisLabel(date, isWeek);
                const isToday = d.day === today;
                const isFuture = d.day > today;

                return (
                    <g key={d.day} onClick={() => !isFuture && onSelectDay(d.day)} className={isFuture ? "" : "cursor-pointer"}>
                        {/* Neviditelný zásah přes celou výšku slotu (větší než samotný sloupec) */}
                        <rect x={slotX} y={PADDING.top} width={slotWidth} height={INNER_HEIGHT + PADDING.bottom} fill="transparent" />

                        {d.log_count > 0 && d.calories > 0 ? (
                            <path
                                d={barPath(barX, barTop, barWidth, BASELINE - barTop)}
                                className={`${isOver ? "fill-red-500" : "fill-brand"} transition-opacity`}
                                opacity={isDimmed ? 0.35 : 1}
                            />
                        ) : (
                            // Den bez zápisu — jen tečka na základně (minulé dny), budoucí nic
                            !isFuture && <circle cx={barX + barWidth / 2} cy={BASELINE - 3} r={1.5} className="fill-text-muted/40" />
                        )}

                        {/* Popisek osy X */}
                        {label && (
                            <text
                                x={slotX + slotWidth / 2}
                                y={HEIGHT - 6}
                                textAnchor="middle"
                                className={`text-[10px] ${isSelected || isToday ? "fill-text-main font-bold" : "fill-text-muted"}`}
                            >
                                {label}
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Čára denního cíle (nad sloupci, aby byla vidět i přes ně) */}
            <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={goalY}
                y2={goalY}
                className="stroke-text-muted pointer-events-none"
                strokeWidth={1}
                strokeDasharray="4 4"
            />
            <text x={WIDTH - PADDING.right} y={goalY - 4} textAnchor="end" className="fill-text-muted text-[10px] font-semibold pointer-events-none">
                cíl {goal}
            </text>
        </svg>
    );
}
