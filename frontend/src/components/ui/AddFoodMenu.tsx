import { useState } from "react";
import { Plus, Barcode, PenLine, X } from "lucide-react";
import { useNavigate } from "react-router-dom";


export function AddFoodMenu() {
    // Stav pro to, jestli je menu vysunuté nebo schované
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            {/* Samotné tlačítko + obalené do ostrůvku */}
            <div className="bg-surface-hover p-1 rounded-full flex items-center justify-center">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-surface text-brand p-1.5 aspect-square rounded-full flex items-center justify-center hover:bg-surface/80 active:scale-95 transition-all shadow-sm shrink-0"
                >
                    <Plus size={22} strokeWidth={3} />
                </button>
            </div>

            {/* Ztmavení pozadí (Backdrop) - kliknutím kamkoliv jinam se menu zavře */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Samotné menu (Action Sheet) - vyjíždí zespodu obrazovky */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-[32px] p-6 transition-transform duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                {/* iOS Drag Handle */}
                <div className="w-12 h-1.5 bg-surface-hover rounded-full mx-auto mb-6" />

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-text-main">Přidat jídlo</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 bg-surface-hover hover:bg-surface-hover/80 rounded-full text-text-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Čárový kód */}
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate("/scanner");
                        }}
                        className="flex items-center gap-4 p-4 rounded-3xl bg-surface-hover text-text-main hover:bg-brand/10 hover:text-brand transition-colors text-left"
                    >
                        <div className="bg-surface p-3 rounded-xl shadow-sm">
                            <Barcode size={24} />
                        </div>
                        <div>
                            <span className="block font-bold">Naskenovat kód</span>
                            <span className="block text-xs text-text-muted mt-0.5">Rychlé přidání foťákem</span>
                        </div>
                    </button>

                    {/* Zadat ručně */}
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate("/foods/new");
                        }}
                        className="flex items-center gap-4 p-4 rounded-3xl bg-brand text-white shadow-md active:scale-95 transition-all text-left"
                    >
                        <div className="bg-white/20 p-3 rounded-xl">
                            <PenLine size={24} />
                        </div>
                        <div>
                            <span className="block font-bold">Zadat ručně</span>
                            <span className="block text-xs text-white/80 mt-0.5">Vyplnit nutriční hodnoty v aplikaci</span>
                        </div>
                    </button>
                </div>

                {/* Ochranná zóna kvůli ios */}
                <div className="h-8" />
            </div>
        </>
    );
}
