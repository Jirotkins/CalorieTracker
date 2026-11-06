import { useRef } from "react";
import { Camera } from "lucide-react";

interface Props {
    photoUrl: string;
    isUploading: boolean;
    onSelectFile: (file: File) => void;
}

// Čtvercový výběr fotky s náhledem (iOS nabídne foťák nebo galerii)
export function PhotoPicker({ photoUrl, isUploading, onSelectFile }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex justify-center mt-2">
            {/* Skrytý file input – iOS ukáže volbu foťák/galerie */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onSelectFile(file);
                    // Reset, aby šla vybrat i stejná fotka znovu
                    e.target.value = "";
                }}
            />

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-[2rem] overflow-hidden bg-surface shadow-sm border-2 border-dashed border-brand/40 flex flex-col items-center justify-center text-brand hover:bg-brand/10 active:scale-95 transition-all relative"
            >
                {photoUrl ? (
                    // Náhled fotky
                    <>
                        <img
                            src={photoUrl}
                            alt="Náhled"
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay při uploadu */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        {/* Ikonka pro změnu */}
                        {!isUploading && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-full p-1">
                                <Camera size={12} className="text-white" />
                            </div>
                        )}
                    </>
                ) : (
                    // Placeholder
                    <>
                        <Camera size={32} strokeWidth={1.5} className="mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Fotka</span>
                    </>
                )}
            </button>
        </div>
    );
}
