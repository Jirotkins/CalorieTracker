import { createContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

// Typová struktura uživatele podle UserResponse z FastAPI
export interface User {
    id: number;
    username: string;
    daily_calories_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fat_goal: number;
    daily_saturates_goal: number;
    daily_sugar_goal: number;
    daily_salt_goal: number;
}

// Co všechno Context poskytne ostatním komponentám
interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

// Vytvoření Contextu
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Profil uložený z minula — díky němu je appka po spuštění hned přihlášená
// a nečeká na odpověď /users/me (na iPhonu při studeném startu i 2 s)
function loadCachedUser(): User | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

// Provider komponenta, která obalí celou aplikaci
export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [user, setUserState] = useState<User | null>(() => (token ? loadCachedUser() : null));
    // Čeká se jen tehdy, když je token, ale ještě nemáme uložený profil
    const [isLoading, setIsLoading] = useState<boolean>(() => !!token && !user);

    // Nastaví uživatele a zároveň ho uloží pro příští spuštění
    const setUser = (newUser: User | null) => {
        setUserState(newUser);
        if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
        else localStorage.removeItem('user');
    };

    // Ověření tokenu a načtení aktuálního profilu z backendu (na pozadí)
    const fetchCurrentUser = async () => {
        try {
            const response = await api.get<User>('/users/me');
            setUser(response.data);
        } catch (error: any) {
            console.error('Chyba při načítání uživatele:', error);
            // Odhlásí jen neplatný token (401), nebo když nemáme ani uložený profil.
            // Výpadek sítě s uloženým profilem appku nechá přihlášenou (offline čtení).
            if (error?.response?.status === 401 || !loadCachedUser()) {
                logout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Při spuštění aplikace ověří token uložený v localStorage
    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchCurrentUser();
        }
    }, []);

    // Funkce volaná po úspěšném získání tokenu z Login.tsx
    const login = async (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // Načte profil uživatele
        try {
            const response = await api.get<User>('/users/me');
            setUser(response.data);
        } catch (err) {
            logout();
            throw err;
        }
    };

    // Znovu načte profil (např. po změně denních cílů)
    const refreshUser = async () => {
        const response = await api.get<User>('/users/me');
        setUser(response.data);
    };

    // Funkce pro odhlášení
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Data z API uložená pro offline režim nesmí zůstat dalšímu uživateli
        if ('caches' in window) caches.delete('api-cache').catch(console.error);
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
