import { type ReactNode } from "react";
import { PlusCircle } from "lucide-react";

interface MaealSectionProps {
    title: string;
    totalCalories: number;
    icon: ReactNode;
    children?: ReactNode;
    onAddFood: () => void;
}

export function MealSection({
    title,
    totalCalories,
    icon,
    children,
    onAddFood,
}: MaealSectionProps) {
    return (
        <section className="mt-4">
            <div className="flex flex-col bg-surface rounded-3xl overflow-hidden shadow-xl">
                {/* Hlavička s nadpisem a kaloriemi */}
                <div className="flex items-center justify-between p-4 active:bg-slate-50 
                dark:active:bg-slate-800/50 transition-colors cursor-pointer select-none">
                    {/* Levá část: Ikonka a Texty */}
                    <div className="flex items-center gap-3">
                        {/* Obal pro ikonku, např. se světle fialovým pozadím */}
                        <div className="p-2.5 bg-brand/10 text-brand rounded-full">
                            {icon}
                        </div>
                        
                        <div className="flex flex-col">
                            <h2 className="text-base font-bold text-text-main">{title}</h2>
                            <span className="text-sm font-semibold text-text-muted">
                                {totalCalories} kcal
                            </span>
                        </div>
                    </div>
                    {/* Pravá část: Tlačítko Přidat (+) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Aby se neproklikla celá karta, když chceme jen přidat
                            onAddFood();
                        }}
                        className="p-2 text-brand hover:text-brand-hover hover:bg-brand/10 active:scale-90 rounded-full transition-all"
                        aria-label="Přidat jídlo"
                    >
                        <PlusCircle size={28} strokeWidth={1.5} />
                    </button>
                </div>
                {/* Zde se vykreslí všechny položky FoodLogItem */}
                {children}
            </div>
        </section>
    );
}