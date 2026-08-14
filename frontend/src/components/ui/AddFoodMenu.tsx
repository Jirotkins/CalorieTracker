import { useState } from "react";
import { Plus, Barcode, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionSheet } from "./ActionSheet";


export function AddFoodMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            {/* Tlačítko + */}
            <div className="bg-surface-hover p-1 rounded-full flex items-center justify-center">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-surface text-brand p-1.5 aspect-square rounded-full flex items-center justify-center hover:bg-surface/80 active:scale-95 transition-all shadow-sm shrink-0"
                >
                    <Plus size={22} strokeWidth={3} />
                </button>
            </div>

            {/* ActionSheet — obsah předává jako children */}
            <ActionSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Přidat jídlo">

                {/* Čárový kód */}
                <button
                    onClick={() => { setIsOpen(false); navigate("/scanner"); }}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                >
                    <div className="bg-surface p-3 rounded-xl shadow-sm">
                        <Barcode size={22} className="text-brand" />
                    </div>
                    <div>
                        <span className="block font-bold">Naskenovat kód</span>
                        <span className="block text-xs text-text-muted mt-0.5">Rychlé přidání foťákem</span>
                    </div>
                </button>

                {/* Zadat ručně */}
                <button
                    onClick={() => { setIsOpen(false); navigate("/foods/new"); }}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                >
                    <div className="bg-surface p-3 rounded-xl shadow-sm">
                        <PenLine size={22} className="text-brand" />
                    </div>
                    <div>
                        <span className="block font-bold">Zadat ručně</span>
                        <span className="block text-xs text-text-muted mt-0.5">Vyplnit nutriční hodnoty v aplikaci</span>
                    </div>
                </button>

            </ActionSheet>
        </>
    );
}

