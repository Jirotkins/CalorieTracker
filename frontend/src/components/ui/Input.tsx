import React from 'react';

// Rozšíření standardních vlastností HTML inputu
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

// Destructuring a rest operator (...props)
export function Input({ label, id, ...props }: InputProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col">
            <label htmlFor={inputId} className="block text-sm font-medium text-text-muted mb-1 ml-1">
                {label}
            </label>
            <input
                id={inputId}
                // Tailwind styly
                className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-transparent 
                focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all 
                duration-200 text-text-main placeholder-text-muted/50"
                {...props} 
            />
        </div>
    );
}
