import { useEffect, useState } from "react";
import { type MacroGoal } from "../../types/nutrition";

interface MiniCircularProgressProps {
    data: MacroGoal;
    label: string;
    color: string; // Očekává např. "text-protein"
    size?: number; // Velikost kolečka
    strokeWidth?: number; // Tloušťka čáry
}

export function MiniCircularProgress({
    data,
    label,
    color,
    size = 64,
    strokeWidth = 6,
}: MiniCircularProgressProps) {
    const [progress, setProgress] = useState(0);

    // Matematika pro SVG kruh
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Výpočet procent (rawPercentage pro text, percentage pro oříznutí čáry na max 100%)
    const safeGoal = data.goal > 0 ? data.goal : 1;
    const rawPercentage = (progress / safeGoal) * 100;
    const percentage = Math.min(rawPercentage, 100); 
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Animace najetí
    useEffect(() => {
        const timer = setTimeout(() => setProgress(data.consumed), 100);
        return () => clearTimeout(timer);
    }, [data.consumed]);

    return (
        <div className="flex flex-col items-center justify-center gap-1.5">
            {/* Label */}
            <span className="text-sm font-bold text-text-main">{label}</span>
            
            {/* Zkonzumované gramy */}
            <span className="text-sm font-medium text-text-main">{data.consumed}g</span>

            {/* Kolečko s procenty uvnitř */}
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="transform -rotate-90"
                >
                    {/* Podkladový šedý kruh */}
                    <circle
                        className="text-surface-hover dark:text-surface stroke-current"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Barevný animovaný kruh */}
                    <circle
                        className={`${color} stroke-current transition-all duration-1000 ease-out`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashoffset,
                        }}
                    />
                </svg>
                {/* Text procent uprostřed kolečka */}
                <div className="absolute flex items-center justify-center">
                    <span className="text-xs font-bold text-text-muted">
                        {Math.round(rawPercentage)}%
                    </span>
                </div>
            </div>

            {/* Cílové gramy */}
            <span className="text-xs text-text-muted">{data.goal}g</span>
        </div>
    );
}