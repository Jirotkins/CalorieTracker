import { createContext } from "react";

export type ToastVariant = "success" | "error";

export interface ToastContextType {
    // Krátká hláška nahoře na obrazovce (sama zmizí)
    showToast: (message: string, variant?: ToastVariant) => void;
}

// Context zvlášť od provideru (Fast Refresh chce v .tsx souboru jen komponenty)
export const ToastContext = createContext<ToastContextType | undefined>(undefined);
