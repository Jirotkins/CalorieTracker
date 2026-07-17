import { useTheme } from '../../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

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
                inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300
                ${isDarkMode ? 'bg-brand' : 'bg-yellow-200'} 
                ${className}
            `}
            aria-label='Přepnout motiv'
        >
            {/* Ikony, které se posouvají zleva doprava podle motivu */}
            <span
                className={`flex items-center justify-center duration-300 transition-transform text-slate-300 dark:text-slate-600
                    ${isDarkMode ? 'translate-x-8.5' : 'translate-x-1.5'}
                `}
            >
                {isDarkMode ? (
                    <Moon size={22} strokeWidth={1.5} />
                ) : (
                    <Sun size={22} strokeWidth={1.5} />
                )}
            </span>
        </button>
    );
}
