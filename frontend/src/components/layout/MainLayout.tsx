import { Outlet } from "react-router-dom";
import { BottomNav } from "../ui/BottomNav";

export function MainLayout() {
    return (
        // h-dvh a overflow-hidden uzamknou aplikaci na obrazovku telefonu 
        // a zabrání prohlížeči, aby schovával URL lištu při scrollování
        <div className="h-dvh w-full overflow-hidden relative bg-surface-hover flex flex-col">

            {/* Obsah stránky bude scrollovat uvnitř tohoto boxu */}
            <div className="flex-1 overflow-y-auto pb-24 w-full">
                <Outlet />
            </div>

            {/* Fixní spodní lišta*/}
            <BottomNav />

        </div>
    );
}
