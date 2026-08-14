import { type Food } from "../../types/food";
import { Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
    food: Food;
}

export function FoodCard({ food }: Props) {
    const navigate = useNavigate();

    return (
        <div onClick={() => navigate(`/foods/${food.id}`, { state: { food } })}
            className="bg-surface p-3 rounded-3xl border border-surface-hover flex items-center justify-between shadow-sm">

            {/* Levá část: Fotka + Texty */}
            <div className="flex items-center gap-4">

                {/* Obal pro fotku nebo placeholder*/}
                <div className="w-14 h-14 shrink-0 bg-surface-hover/50 rounded-2xl flex items-center justify-center overflow-hidden border border-surface-hover">
                    {food.photo_url ? (
                        <img
                            src={food.photo_url}
                            alt={food.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Utensils className="text-brand" size={24} />
                    )}
                </div>

                <div className="flex flex-col">
                    <h3 className="font-bold text-text-main text-base leading-tight line-clamp-2">
                        {food.name}
                    </h3>

                    <div className="flex gap-3 text-[11px] font-semibold mt-1">
                        <span className="text-protein">B: {food.protein_per_100g}g</span>
                        <span className="text-carbs">S: {food.carbs_per_100g}g</span>
                        <span className="text-fats">T: {food.fat_per_100g}g</span>
                    </div>
                </div>
            </div>

            {/* Pravá část: Kalorie */}
            <div className="flex flex-col items-end shrink-0 ml-2">
                <span className="text-brand font-black text-xl">{food.calories_per_100g}</span>
                <span className="text-text-muted text-[10px] font-medium uppercase tracking-wider">kcal/100g</span>
            </div>

        </div>
    );
}
