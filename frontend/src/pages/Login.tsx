import { useState } from 'react';
import { api } from '../services/api';

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
        <div>
            <form onSubmit={handleLogin}>
                {error && <div>{error}</div>}

                <input
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type='submit' disabled={isLoading}>
                    {isLoading ? 'Načítám...' : 'Přihlásit'}
                </button>
            </form>
        </div>
    );
}