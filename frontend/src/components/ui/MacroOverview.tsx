import { MiniCircularProgress } from "./MiniCircularProgress";
import { type DailyNutrition } from "../../types/nutrition";

// Komponenta očekává celý objekt se všemi makry pro daný den
interface MacroOverviewProps {
    nutritionData: DailyNutrition;
}

export function MacroOverview({ nutritionData }: MacroOverviewProps) {
    return (
        <section className="flex flex-col p-5 bg-surface rounded-3xl shadow-xl">
            {/* 1. Patro - Hlavní Makroživiny */}
            <h2 className="text-lg font-semibold text-text-main mb-4 text-center">Makroživiny</h2>
            <div className="flex flex-row justify-around items-end w-full">
                <MiniCircularProgress label="Bílkoviny" data={nutritionData.protein} color="text-protein" />
                <MiniCircularProgress label="Sacharidy" data={nutritionData.carbs} color="text-carbs" />
                <MiniCircularProgress label="Tuky" data={nutritionData.fats} color="text-fats" />
            </div>

            {/* 2. Patro - Detailní živiny */}
            <div className="flex flex-row justify-around items-end w-full mt-4">
                <MiniCircularProgress label="Sůl" data={nutritionData.salt} color="text-salt" />
                <MiniCircularProgress label="Cukry" data={nutritionData.sugar} color="text-sugar" />
                <MiniCircularProgress label="Plasty" data={nutritionData.saturates} color="text-saturates" />
            </div>
        </section>
    );
}