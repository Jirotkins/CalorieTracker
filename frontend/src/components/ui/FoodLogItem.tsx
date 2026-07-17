import { Circle, Eye } from "lucide-react";

interface FoodLogItemProps {
    name: string;
    grams: number;
    calories: number;
    onClickInfo?: () => void;
    onClickItem?: () => void;
}

export function FoodLogItem({ name, grams, calories, onClickInfo, onClickItem }: FoodLogItemProps) {
    return (
        <div 
            onClick={onClickItem}
            className="flex items-center justify-between p-4 bg-surface select-none"
        >
            
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <Circle 
                    size={24} 
                    strokeWidth={1.5} 
                    className="text-slate-300 dark:text-slate-600 flex-shrink-0" 
                />
                
                <div className="flex flex-col flex-1 overflow-hidden pr-2">
                    {/* truncate zajistí, že dlouhý text neskočí na další řádek, ale udělá tečky... */}
                    <span className="text-base font-semibold text-text-main truncate">
                        {name}
                    </span>
                    
                    <div className="flex gap-2 text-[15px] mt-0.5">
                        <span className="text-brand font-semibold">{grams} g</span>
                        <span className="text-text-muted">{calories} kcal</span>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClickInfo) onClickInfo();
                }}
                className="p-3 -mr-2 text-slate-400 active:text-brand transition-colors"
                aria-label="Více informací"
            >
                <Eye size={22} strokeWidth={1.5} />
            </button>

        </div>
    );
}