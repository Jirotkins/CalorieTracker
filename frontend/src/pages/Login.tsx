import { useState } from 'react';
import { api } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function Login() {
    // Definování stavu dat (Observer)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Načítací kolečko
    const [error, setError] = useState('');

    // Logika přihlašování
    const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault(); // Neobnoví se celá stránka
        setIsLoading(true);
        setError('');
        try { // Příprava dat pro FastAPI
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            // Odeslání do sítě
            const response = await api.post('/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            // Uložení tajného klíče
            localStorage.setItem('token', response.data.access_token);
            alert('Vítej');
        }
        catch (err) {
            // Nastavení chybové hlášky pokud Axios vyhodí chybu
            setError('Nesprávné jméno nebo heslo');
        }
        finally {
            // Vypnutí načítacího kolečka nehledě na výstup
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">

            <ThemeToggle className="absolute top-6 right-6" />

            <section className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-surface-hover">

                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-text-main mb-2">CalorieTracker</h1>
                    <p className="text-text-muted">Přihlas se do svého účtu</p>
                </header>
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}
                    <fieldset className="space-y-4 border-none p-0 m-0">
                        <Input
                            label="Uživatelské jméno"
                            type="text"
                            placeholder="Uživatelské jméno"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            label="Heslo"
                            type="password"
                            placeholder="Heslo"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </fieldset>
                    <Button type="submit" isLoading={isLoading} className='mt-4'>
                        Přihlásit se
                    </Button>
                </form>
            </section>
        </main>
    );
}