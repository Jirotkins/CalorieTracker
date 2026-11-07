import { useState, useCallback, useRef, type ReactNode } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ToastContext, type ToastVariant } from "../../context/toastContext";

// Jak dlouho je hláška vidět (ms)
const TOAST_DURATION = 2500;

interface Toast {
    id: number;
    message: string;
    variant: ToastVariant;
}

// Zobrazuje krátké hlášky (uloženo, smazáno, chyba) místo blokujícího alert()
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<Toast | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
        // Nová hláška nahradí předchozí a časovač začne znovu
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setToast({ id: Date.now(), message, variant });
        hideTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Hláška nahoře pod výřezem displeje — nad sheety i spodní lištou */}
            <div className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
                {toast && (
                    <div
                        key={toast.id}
                        role={toast.variant === "error" ? "alert" : "status"}
                        className="toast-enter flex items-center gap-2 max-w-sm px-4 py-3 rounded-2xl bg-surface text-text-main font-semibold text-sm shadow-2xl border border-surface-hover pointer-events-auto"
                        onClick={() => setToast(null)}
                    >
                        {toast.variant === "error"
                            ? <AlertCircle size={18} className="text-red-500 shrink-0" />
                            : <CheckCircle2 size={18} className="text-brand shrink-0" />}
                        {toast.message}
                    </div>
                )}
            </div>
        </ToastContext.Provider>
    );
}
