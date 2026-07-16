import { useEffect, useState } from "react";
import { type MacroGoal } from "../../types/nutrition";

interface CircularProgressProps {
    data: MacroGoal;
    size?: number; // Průměr kruhu v pixelech
    strokeWidth?: number; // Tloušťka čáry
    label?: string;
}

export function CircularProgress({
    data,
    size = 260,
    strokeWidth = 18,
    label = 'Kalorie'
}: CircularProgressProps) {
    const [progress, setProgress] = useState(0); // Pro animaci nejdříve 0

    // SVG kruh
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Je cíl přečerpaný?
    const isOver = data.consumed > data.goal;

    // Omezení výplňe kruhu na 100% kvůli přečerpání
    const safeGoal = data.goal > 0 ? data.goal : 1;
    const percentage = Math.min((progress / safeGoal) * 100, 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Progress postupně zvedneme z 0 na reálnou hodnotu
    useEffect(() => {
        const timer = setTimeout(() => setProgress(data.consumed), 100);
        return () => clearTimeout(timer);
    }, [data.consumed]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* SVG Kruhy */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90" // Otočíme kruh o 90 stupňů, aby začínal nahoře na 12 hodinách
            >
                {/* Podkladový prázdný kruh */}
                <circle
                    className="text-surface-hover dark:text-surface stroke-current"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />

                {/* Barevný kruh (vyplněný podle progresu) */}
                <circle
                    // Pokud přečerpá, změní barvu na červenou
                    className={`${isOver ? 'text-red-500' : 'text-brand'} stroke-current transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round" // Zakulacené konce čáry
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
            {/* Čísla uvnitř kruhu */}
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-text-muted font-bold text-xs uppercase tracking-widest mb-1">
                    {label}
                </span>

                <span className={`text-5xl font-black tabular-nums tracking-tighter ${isOver ? 'text-red-500' : 'text-text-main'}`}>
                    {data.consumed}
                </span>

                <span className="text-text-muted font-medium mt-1">
                    / {data.goal} kcal
                </span>
            </div>
        </div>
    );
}