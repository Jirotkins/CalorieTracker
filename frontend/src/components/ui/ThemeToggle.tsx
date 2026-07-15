import { useTheme } from '../../hooks/useTheme';

// Komponenta může přijmout extra CSS třídy zvenku
interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    // Komponenta si sama sáhne pro logiku z našeho hooku
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            // Spojení vzhledu s požadavky zvenku
            className={`
                inline-flex h-8 w-16 items-center rounded-full transition-colors 
                duration-300 focus:outline-none focus:ring-2 focus:ring-brand/50
                ${isDarkMode ? 'bg-brand' : 'bg-slate-300'} 
                ${className}
            `}
            aria-label='Přepnout motiv'
        >
            {/* "Kolečko" switche: bílé, s ikonou uvnitř, posouvá se zleva doprava */}
            <span
                className={`
                    inline-flex h-6 w-6 transform items-center justify-center 
                    rounded-full bg-white shadow-md transition-transform duration-300
                    ${isDarkMode ? 'translate-x-9' : 'translate-x-1'}
                `}
            >
                {/* Ikona uvnitř kolečka */}
                <span className="text-xs leading-none select-none">
                    {isDarkMode ? '🌙' : '☀️'}
                </span>
            </span>
        </button>
    );
}
