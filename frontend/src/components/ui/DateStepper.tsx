import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DateStepperProps {
    date: Date;
    onChange: (newDate: Date) => void;
}

export function DateStepper({ date, onChange }: DateStepperProps) {
    // Pomocná funkce pro zjištění, jestli je vybraný den "Dnes"
    const isToday = new Date().toDateString() === date.toDateString();

    // Naformátování datumu, např. "St, 17. července"
    const formattedDate = new Intl.DateTimeFormat('cs-CZ', {
        weekday: 'short', 
        day: 'numeric', 
        month: 'long'
    }).format(date);

    // První písmeno velké (aby bylo "St" místo "st")
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    const handlePrevDay = () => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() - 1);
        onChange(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + 1);
        onChange(newDate);
    };

    const handleResetToToday = () => {
        onChange(new Date());
    };

    return (
        // Obal ve tvaru pilulky
        <div className="flex items-center justify-between bg-surface rounded-full shadow-sm border border-slate-100 dark:border-slate-800 w-full max-w-xs mx-auto mb-2">
            
            <button 
                onClick={handlePrevDay}
                className="p-3 text-slate-400 hover:text-brand active:scale-90 transition-all rounded-full"
                aria-label="Předchozí den"
            >
                <ChevronLeft size={24} />
            </button>
            
            <div 
                onClick={handleResetToToday}
                className="flex flex-col items-center justify-center flex-1 select-none cursor-pointer active:opacity-70 transition-opacity"
            >
                <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    {isToday && <Calendar size={14} className="text-brand" />}
                    {isToday ? "Dnes" : capitalizedDate}
                </span>
                
                {/* Zobrazí se jen, když uživatel není na dnešku */}
                {!isToday && (
                    <span className="text-[10px] text-brand font-bold uppercase tracking-widest mt-0.5">
                        Zpět na Dnes
                    </span>
                )}
            </div>
            
            <button 
                onClick={handleNextDay}
                className="p-3 text-slate-400 hover:text-brand active:scale-90 transition-all rounded-full"
                aria-label="Následující den"
            >
                <ChevronRight size={24} />
            </button>
            
        </div>
    );
}