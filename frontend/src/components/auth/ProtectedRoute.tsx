import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <div className="p-4 text-center">Načítání...</div>

    if (!isAuthenticated) return <Navigate to="/" replace />

    return children
}