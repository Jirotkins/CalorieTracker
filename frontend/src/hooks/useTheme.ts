import { useState, useEffect } from 'react';

export function useTheme() {
    // Inicializace stavu
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Načteme konfiguraci z localStorage pokud nějaké je
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        
        // Nastavení ze systému
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Reakce na změnu
    useEffect(() => {
        const root = window.document.documentElement; // Hlavní <html> tag v prohlížeči
        
        if (isDarkMode) {
            root.classList.add('dark'); // Přidá třídu -> aktivuje Tmavý režim v index.css
            localStorage.setItem('theme', 'dark'); // Uloží volbu do localStorage
        } else {
            root.classList.remove('dark'); // Odebere třídu -> aktivuje Světlý režim
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // funkce pro otočení stavu
    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    // Hook vrací jen to nejnutnější pro zbytek aplikace
    return { isDarkMode, toggleTheme };
}
