import { NavLink } from "react-router-dom";
import { Home, Apple, Settings } from "lucide-react";

export function BottomNav() {
    // Automaticky obarví ikonu aktivní stránky
    const navItemClasses = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-16 h-14 gap-1 transition-all ${isActive ? "text-brand scale-110" : "text-text-muted hover:text-text-main"
        }`;
    return (
        // Obal: posune to nahoru a vycentruje
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">

            {/* Samotný ostrůvek */}
            <nav className="w-full max-w-sm h-16 bg-surface/20 backdrop-blur-xl border border-surface-hover/20 rounded-full shadow-2xl shadow-brand/10 flex justify-around items-center px-2 pointer-events-auto">
                <NavLink to="/dashboard" className={navItemClasses}>
                    <Home size={22} strokeWidth={2.5} />
                    <span className="text-[10px] font-semibold">Přehled</span>
                </NavLink>
                <NavLink to="/foods" className={navItemClasses}>
                    <Apple size={22} strokeWidth={2.5} />
                    <span className="text-[10px] font-semibold">Jídla</span>
                </NavLink>
                <NavLink to="/settings" className={navItemClasses}>
                    <Settings size={22} strokeWidth={2.5} />
                    <span className="text-[10px] font-semibold">Nastavení</span>
                </NavLink>
            </nav>

        </div>
    );
}