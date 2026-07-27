import { Outlet } from "react-router-dom";
import { BottomNav } from "../ui/BottomNav";

export function MainLayout() {
    return (
        // min-h-dvh drží aplikaci přes celou obrazovku
        <div className="min-h-dvh flex flex-col pb-24 relative">

            {/* React Router vykreslí jakoukoliv podstránku (Dashboard, Settings, atd.) */}
            <Outlet />

            {/* Fixní spodní lišta */}
            <BottomNav />

        </div>
    );
}
