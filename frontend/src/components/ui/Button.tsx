import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({ isLoading, children, className, disabled, ...props }: ButtonProps) {
    // Je tlačítko vypnuté?
    const isDisabled = isLoading || disabled;

    return (
        <button 
            disabled={isDisabled}
            className={`
                w-full py-3 px-4 rounded-xl font-semibold text-white flex justify-center items-center gap-2
                bg-brand hover:bg-brand-hover 
                transition-all duration-300 ease-out
                ${isDisabled 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/40 active:translate-y-0 active:scale-95'
                }
                ${className || ''} 
            `}
            {...props}
        >
            {isLoading ? (
                <>
                    {/* Znovupoužitelný spinner */}
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Zpracovávám...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
