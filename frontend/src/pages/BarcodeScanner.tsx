import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X } from "lucide-react";
import { api } from "../services/api";

export default function BarcodeScanner() {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isProcessingRef = useRef(false);

    const startPromiseRef = useRef<Promise<any> | null>(null);

    useEffect(() => {
        let isMounted = true;
        // Inicializuje pouze čistou třídu
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        // Omezí formáty pouze na 1D čárové kódy
        const config = {
            fps: 15,
            qrbox: { width: 300, height: 150 },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
            ],
        };

        const startScanner = () => {
            if (!isMounted) return;

            const promise = scanner.start(
                { facingMode: "environment" }, // Striktně zadní kamera
                config,
                async (decodedText) => {
                    // Zabraňuje paralelnímu spuštění
                    if (isProcessingRef.current) return;
                    isProcessingRef.current = true;

                    if (isMounted) setIsScanning(false);

                    // Zastaví kameru okamžitě po načtení kódu
                    try {
                        if (scanner.isScanning) {
                            await scanner.stop();
                        }
                    } catch (e) {
                        console.error("Chyba při zastavování kamery", e);
                    }

                    try {
                        const response = await api.get(`/foods/barcode/${decodedText}`);
                        const data = response.data;

                        if (data.found_in_our_db) {
                            alert(`Tato potravina už v databázi existuje: ${data.food.name}`);
                            if (isMounted) navigate('/dashboard');
                        } else {
                            if (isMounted) navigate('/foods/new', { state: { prefilledData: data.food } });
                        }
                    } catch (err: any) {
                        console.error(err);
                        if (isMounted) setError(err.response?.data?.detail || "Jídlo nebylo nalezeno v žádné databázi.");

                        setTimeout(() => {
                            if (!isMounted) return;
                            setError(null);
                            setIsScanning(true); // Umožní skenovat znovu
                            isProcessingRef.current = false; // Resetuje zámek
                            // Znovu zapne kameru po chybě
                            startScanner();
                        }, 3000);
                    }
                },
                () => {
                    // FAILURE: Volá se při každém snímku, kde není kód
                }
            ).catch((err) => {
                if (isMounted) {
                    console.error("Nepodařilo se spustit kameru:", err);
                    setError("Nepodařilo se spustit kameru. Povolte přístup.");
                }
            });

            startPromiseRef.current = promise;
        };

        // Spustíme poprvé
        startScanner();

        // CLEANUP: Zaručí vypnutí kamery při odchodu
        return () => {
            isMounted = false;
            // Počkáme, až se případný start dokončí, a pak kameru tvrdě vypneme
            if (startPromiseRef.current) {
                startPromiseRef.current
                    .then(() => {
                        if (scanner.isScanning) {
                            scanner.stop().then(() => {
                                scanner.clear();
                            }).catch(console.error);
                        }
                    })
                    .catch(() => { });
            }
        };
    }, [navigate]);

    return (
        <main className="h-dvh bg-black relative text-white overflow-hidden">

            {/* Kamera - Surový video feed */}
            <div id="reader" className="absolute inset-0 w-full h-full object-cover" />

            {/* Rozmazaný overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">

                {/* Ztmavovací horní pruh */}
                <div className="bg-black/60 backdrop-blur-md h-1/4 w-full flex items-start p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full pointer-events-auto active:scale-95 transition-transform"
                    >
                        <X size={24} />
                    </button>
                    <h1 className="flex-1 text-center font-semibold text-lg mt-3 mr-12 text-white drop-shadow-md">
                        Naskenuj čárový kód
                    </h1>
                </div>

                {/* Střední pruh s výřezem */}
                <div className="flex flex-1 w-full relative">
                    <div className="bg-black/60 backdrop-blur-md flex-1" />

                    {/* Samotný zaměřovač (průhledný skrz) */}
                    <div className="w-[300px] h-[150px] relative mt-auto mb-auto bg-transparent shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] rounded-xl ring-2 ring-white/10 ring-inset">
                        {/* Rohy zaměřovače */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-xl" />

                        {/* Laserová animace */}
                        {isScanning && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-brand shadow-[0_0_15px_3px_rgba(139,92,246,0.8)] animate-laser" />
                        )}
                    </div>

                    <div className="bg-black/60 backdrop-blur-md flex-1" />
                </div>

                {/* Ztmavovací spodní pruh */}
                <div className="bg-black/60 backdrop-blur-md h-1/3 w-full flex flex-col items-center justify-center p-8 text-center">
                    {isScanning && !error && (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-white/80 font-medium text-sm">
                                Namiř na čárový kód
                            </p>
                            <p className="text-white/50 text-xs">
                                Drž telefon <span className="text-white/80 font-semibold">20–30 cm</span> od obalu
                            </p>
                        </div>
                    )}
                    {!isScanning && !error && (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="font-medium text-white/90">Hledám v databázi...</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-md text-red-200 animate-bounce">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
