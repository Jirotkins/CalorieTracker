import { X } from "lucide-react"

interface Props {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode  // Obsah sheetu — tlačítka, položky...
}

export function ActionSheet({ isOpen, onClose, title, children }: Props) {
    return (
        <>
            {/* Backdrop — poloprůhledné pozadí, kliknutím zavře */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sheet — vyjíždí zdola pomocí translate-y */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-[32px] p-6 transition-transform duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${
                    isOpen ? "translate-y-0" : "translate-y-full"
                }`}
            >
                {/* iOS Drag Handle */}
                <div className="w-12 h-1.5 bg-surface-hover rounded-full mx-auto mb-6" />

                {/* Hlavička s názvem a X tlačítkem */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-text-main">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-surface-hover hover:bg-surface-hover/80 rounded-full text-text-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Obsah předaný zvenčí — children pattern */}
                <div className="flex flex-col gap-3">
                    {children}
                </div>

                {/* Ochranná zóna pro iOS home indicator */}
                <div className="h-8" />
            </div>
        </>
    )
}
