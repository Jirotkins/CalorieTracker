import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarcodeDetector, prepareZXingModule } from "barcode-detector/ponyfill";
import zxingWasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";
import { X, PenLine, ScanLine, Utensils } from "lucide-react";
import { api } from "../services/api";
import { type Food } from "../types/food";

// WASM dekodér (zxing-cpp) se načítá z našeho serveru, ne z CDN
prepareZXingModule({
    overrides: {
        locateFile: (path: string, prefix: string) => path.endsWith(".wasm") ? zxingWasmUrl : prefix + path,
    },
});

// Interval mezi pokusy o dekódování (ms)
const SCAN_INTERVAL = 120;
// O kolik se skenovaná oblast zvětší oproti zaměřovači (kód nemusí být přesně uvnitř)
const SCAN_MARGIN = 0.25;

// Spočítá výřez snímku (v pixelech kamery), který odpovídá zaměřovači na obrazovce.
// Video je zobrazené přes object-fit: cover → je zvětšené a oříznuté na střed.
function getScanRegion(video: HTMLVideoElement, target: HTMLElement) {
    const videoRect = video.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const scale = Math.max(videoRect.width / video.videoWidth, videoRect.height / video.videoHeight);
    const offsetX = (videoRect.width - video.videoWidth * scale) / 2;
    const offsetY = (videoRect.height - video.videoHeight * scale) / 2;

    const marginX = targetRect.width * SCAN_MARGIN;
    const marginY = targetRect.height * SCAN_MARGIN;
    const left = (targetRect.left - videoRect.left - marginX - offsetX) / scale;
    const top = (targetRect.top - videoRect.top - marginY - offsetY) / scale;
    const width = (targetRect.width + marginX * 2) / scale;
    const height = (targetRect.height + marginY * 2) / scale;

    // Oříznutí na hranice snímku
    const x = Math.max(0, Math.round(left));
    const y = Math.max(0, Math.round(top));
    return {
        x,
        y,
        width: Math.min(video.videoWidth - x, Math.round(width + Math.min(0, left))),
        height: Math.min(video.videoHeight - y, Math.round(height + Math.min(0, top))),
    };
}

export default function BarcodeScanner() {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Kód, který není v naší DB ani v Open Food Facts → nabídne ruční přidání
    const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
    // Jídlo s tímto kódem už v naší DB je → nabídne přechod na jeho detail
    const [foundFood, setFoundFood] = useState<Food | null>(null);
    // Znovu spustí skenování (nastavuje se uvnitř efektu, kde žije kamera)
    const restartRef = useRef<() => void>(() => { });
    const videoRef = useRef<HTMLVideoElement>(null);
    const aimRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        let stream: MediaStream | null = null;
        let scanTimer: ReturnType<typeof setTimeout> | null = null;
        let isProcessing = false;

        // Jen 1D kódy z obalů potravin
        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        // Canvas pro výřez snímku v plném rozlišení kamery
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        const stopCamera = () => {
            if (scanTimer) clearTimeout(scanTimer);
            scanTimer = null;
            stream?.getTracks().forEach((track) => track.stop());
            stream = null;
        };

        const scheduleScan = () => {
            if (isMounted && !isProcessing) {
                scanTimer = setTimeout(scanFrame, SCAN_INTERVAL);
            }
        };

        const scanFrame = async () => {
            const video = videoRef.current;
            const aim = aimRef.current;
            if (!video || !aim || !context || video.readyState < video.HAVE_ENOUGH_DATA) {
                scheduleScan();
                return;
            }

            const region = getScanRegion(video, aim);
            if (region.width <= 0 || region.height <= 0) {
                scheduleScan();
                return;
            }
            canvas.width = region.width;
            canvas.height = region.height;
            context.drawImage(video, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

            try {
                const barcodes = await detector.detect(canvas);
                if (barcodes.length > 0 && isMounted && !isProcessing) {
                    await handleCode(barcodes[0].rawValue);
                    return;
                }
            } catch (err) {
                console.error("Chyba při dekódování snímku:", err);
            }
            scheduleScan();
        };

        const handleCode = async (code: string) => {
            // Zabraňuje paralelnímu zpracování
            isProcessing = true;
            setIsScanning(false);
            // Zastaví kameru okamžitě po načtení kódu
            stopCamera();

            try {
                const response = await api.get(`/foods/barcode/${code}`);
                const data = response.data;

                if (data.found_in_our_db) {
                    if (isMounted) setFoundFood(data.food);
                } else {
                    if (isMounted) navigate('/foods/new', { state: { prefilledData: data.food } });
                }
            } catch (err: any) {
                console.error(err);
                if (!isMounted) return;

                // Nenalezeno nikde → uživatel si vybere, jestli přidat ručně nebo skenovat znovu
                if (err.response?.status === 404) {
                    setNotFoundCode(code);
                    return;
                }

                setError(err.response?.data?.detail || "Jídlo nebylo nalezeno v žádné databázi.");

                setTimeout(() => {
                    if (!isMounted) return;
                    setError(null);
                    setIsScanning(true); // Umožní skenovat znovu
                    isProcessing = false; // Resetuje zámek
                    // Znovu zapne kameru po chybě
                    startCamera();
                }, 3000);
            }
        };

        const startCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError("Kamera není dostupná (je potřeba HTTPS).");
                return;
            }

            try {
                // Zadní kamera ve vysokém rozlišení — čárové kódy potřebují detail
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                });

                // Stránka mezitím mohla být opuštěna
                if (!isMounted) {
                    newStream.getTracks().forEach((track) => track.stop());
                    return;
                }
                stream = newStream;

                // Kontinuální ostření tam, kde ho prohlížeč podporuje (Android)
                const [track] = newStream.getVideoTracks();
                const capabilities = track.getCapabilities?.() as { focusMode?: string[] } | undefined;
                if (capabilities?.focusMode?.includes("continuous")) {
                    track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => { });
                }

                const video = videoRef.current;
                if (!video) return;
                video.srcObject = newStream;
                await video.play();
                scheduleScan();
            } catch (err) {
                if (isMounted) {
                    console.error("Nepodařilo se spustit kameru:", err);
                    setError("Nepodařilo se spustit kameru. Povolte přístup.");
                }
            }
        };

        restartRef.current = () => {
            setNotFoundCode(null);
            setFoundFood(null);
            setIsScanning(true);
            isProcessing = false;
            startCamera();
        };

        startCamera();

        // CLEANUP: Zaručí vypnutí kamery při odchodu
        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [navigate]);

    return (
        <main className="h-dvh bg-black relative text-white overflow-hidden">

            {/* Kamera - surový video feed přes celou obrazovku */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
            />

            {/* Ztmavený overlay (bez blur efektu — ten na živém videu zbytečně zatěžuje GPU) */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">

                {/* Ztmavovací horní pruh */}
                <div className="bg-black/60 h-1/4 w-full flex items-start p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
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
                    <div className="bg-black/60 flex-1" />

                    {/* Samotný zaměřovač (průhledný skrz) — podle něj se počítá skenovaná oblast */}
                    <div ref={aimRef} className="w-[300px] h-[150px] relative mt-auto mb-auto bg-transparent shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] rounded-xl ring-2 ring-white/10 ring-inset">
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

                    <div className="bg-black/60 flex-1" />
                </div>

                {/* Ztmavovací spodní pruh */}
                <div className="bg-black/60 h-1/3 w-full flex flex-col items-center justify-center p-8 text-center">
                    {isScanning && !error && (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-white/80 font-medium text-sm">
                                Namiř na čárový kód
                            </p>
                            <p className="text-white/50 text-xs">
                                Drž telefon <span className="text-white/80 font-semibold">15–25 cm</span> od obalu
                            </p>
                        </div>
                    )}
                    {!isScanning && !error && !notFoundCode && !foundFood && (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="font-medium text-white/90">Hledám v databázi...</p>
                        </div>
                    )}
                    {foundFood && (
                        <div className="flex flex-col items-center gap-3 w-full max-w-xs pointer-events-auto">
                            <div className="flex items-center gap-3 w-full bg-white/10 rounded-2xl p-3 text-left">
                                <div className="w-12 h-12 shrink-0 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                                    {foundFood.photo_url ? (
                                        <img src={foundFood.photo_url} alt={foundFood.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Utensils size={20} className="text-brand" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/60 text-xs">Už máš v databázi</p>
                                    <p className="font-semibold text-white truncate">{foundFood.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/foods/${foundFood.id}`, { state: { food: foundFood } })}
                                className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                            >
                                <Utensils size={18} />
                                Zobrazit jídlo
                            </button>
                            <button
                                onClick={() => restartRef.current()}
                                className="w-full flex items-center justify-center gap-2 bg-white/15 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                            >
                                <ScanLine size={18} />
                                Skenovat znovu
                            </button>
                        </div>
                    )}
                    {notFoundCode && (
                        <div className="flex flex-col items-center gap-3 w-full max-w-xs pointer-events-auto">
                            <p className="font-semibold text-white">Potravina nebyla nalezena</p>
                            <p className="text-white/60 text-xs -mt-2">Kód {notFoundCode}</p>
                            <button
                                onClick={() => navigate('/foods/new', { state: { prefilledData: { barcode: notFoundCode } } })}
                                className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                            >
                                <PenLine size={18} />
                                Přidat ručně
                            </button>
                            <button
                                onClick={() => restartRef.current()}
                                className="w-full flex items-center justify-center gap-2 bg-white/15 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                            >
                                <ScanLine size={18} />
                                Skenovat znovu
                            </button>
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
