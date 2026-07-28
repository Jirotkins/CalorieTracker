import React from "react";

interface NutrientRowProps {
    label: string;
    name: string;
    value: string;
    colorClass: string;
    isSubItem?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NutrientRow = ({ label, name, value, colorClass, isSubItem = false, onChange }: NutrientRowProps) => (
    <div className={`flex items-center justify-between transition-colors
        ${isSubItem ? "py-3 pl-8 pr-4 bg-surface-hover/20" : "p-4"} 
        ${name !== "salt_per_100g" ? "border-b border-surface-hover" : ""} 
        active:bg-slate-50 dark:active:bg-slate-800/50`
    }>
        <span className={isSubItem ? "text-sm font-medium text-text-muted" : "font-semibold text-text-main"}>
            {label}
        </span>
        <input
            required
            type="text"
            inputMode="decimal"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={name === "calories_per_100g" ? "0" : "0.0"}
            className={`w-20 text-right bg-transparent focus:outline-none ${colorClass} 
                ${name === "calories_per_100g" ? "text-lg font-black" : isSubItem ? "font-bold text-sm" : "font-bold"}`
            }
        />
    </div>
);
