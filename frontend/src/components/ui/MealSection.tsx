import { type ReactNode } from "react";

interface MaealSectionProps {
    title: string;
    totalCalories: number;
    children: ReactNode;
}

export function MealSection({
    title,
    totalCalories,
    children
}: MaealSectionProps) {
    return (
        <section className="mt-8">
            {/* Hlavička s nadpisem a kaloriemi */}
            <div className="flex justify-between items-end mb-3 px-1">
                <h2 className="text-xl font-bold text-text-main">{title}</h2>
                <span className="text-sm font-semibold text-text-muted">
                    {totalCalories} kcal
                </span>
            </div>
            {/* Obalový ostrůvek pro iOS styl */}
            <div className="flex flex-col bg-surface rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                {/* Zde se vykreslí všechny položky FoodLogItem */}
                {children}
            </div>
        </section>
    );
}