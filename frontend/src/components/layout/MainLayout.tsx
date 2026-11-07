import { Outlet } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { BottomNav } from "../ui/BottomNav";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function MainLayout() {
    const isOnline = useOnlineStatus();

    return (
        // h-dvh a overflow-hidden uzamknou aplikaci na obrazovku telefonu 
        // a zabrání prohlížeči, aby schovával URL lištu při scrollování
        <div className="h-dvh w-full overflow-hidden relative bg-surface-hover flex flex-col">

            {/* Bez signálu: data jsou z cache (service worker), ukládání nefunguje */}
            {!isOnline && (
                <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-surface text-text-muted text-xs font-semibold border-b border-surface-hover">
                    <WifiOff size={14} />
                    Jsi offline — zobrazují se uložená data, změny teď nejde uložit
                </div>
            )}

            {/* Obsah stránky bude scrollovat uvnitř tohoto boxu */}
            <div className="flex-1 overflow-y-auto pb-24 w-full">
                <Outlet />
            </div>

            {/* Fixní spodní lišta*/}
            <BottomNav />

        </div>
    );
}
