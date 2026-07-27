import { useAuth } from "../hooks/useAuth";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export default function Settings() {
    const { logout } = useAuth();

    return (
        <main className="p-4 flex flex-col gap-6 max-w-md mx-auto pb-10 mt-4">
            <header className="flex flex-col items-center gap-1">
                <h1 className="text-2xl font-bold text-text-main">Nastavení</h1>
                <p className="text-text-muted font-medium">Tvůj profil a preference</p>
            </header>

            {/* Nastavení vzhledu */}
            <div className="flex justify-between items-center bg-surface p-4 rounded-3xl border border-surface-hover">
                <span className="font-medium">Světlý / tmavý režim</span>
                <ThemeToggle />
            </div>

            {/* Odhlášení jako velké varovné tlačítko */}
            <button
                onClick={logout}
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-semibold p-4 rounded-3xl mt-4"
            >
                Odhlásit se
            </button>
        </main>
    );
}
