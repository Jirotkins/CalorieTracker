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
}

// Vytvoření Contextu
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider komponenta, která obalí celou aplikaci
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Načtení dat o uživateli z backendu
    const fetchCurrentUser = async () => {
        try {
            const response = await api.get<User>('/users/me');
            setUser(response.data);
        } catch (error) {
            // Pokud token neplatí, vymaže ho
            console.error('Chyba při načítání uživatele:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    // Při prvním načtení aplikace zkontroluje, zda má v localStorage token
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchCurrentUser();
        } else {
            setIsLoading(false);
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

    // Funkce pro odhlášení
    const logout = () => {
        localStorage.removeItem('token');
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
