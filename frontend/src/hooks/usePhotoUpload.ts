import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { resizeImageForUpload } from "../utils/image";
import { useToast } from "./useToast";

// Jen fotky nahrané na náš server jde mazat (OFF fotky jsou externí odkazy)
function isLocalPhoto(url: string | null | undefined): url is string {
    return !!url && url.startsWith("/static/photos/");
}

// Nahrávání fotky pro formuláře (jídlo, recept):
// - okamžitý náhled, zmenšení v telefonu, upload na server
// - úklid nahraných fotek, pokud formulář nebyl uložen
// - původní fotku záznamu smaže až po úspěšném uložení nové
export function usePhotoUpload(initialUrl: string = "") {
    const [photoUrl, setPhotoUrl] = useState(initialUrl);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    // Pro sledování, zda má fotku smazat při opuštění stránky
    const uploadedPhotoUrlRef = useRef<string | null>(null);
    const isSubmittedRef = useRef(false);
    // Fotka uloženého záznamu — smaže se až po úspěšném uložení nové
    const originalPhotoUrlRef = useRef<string | null>(null);

    // Cleanup při opuštění stránky (např. tlačítko zpět)
    useEffect(() => {
        return () => {
            // Pokud fotku nahráli, ale formulář nebyl odeslán
            if (!isSubmittedRef.current && uploadedPhotoUrlRef.current) {
                api.delete("/upload", { data: { url: uploadedPhotoUrlRef.current } })
                    .catch(console.error);
            }
        };
    }, []);

    // Režim úprav: nastaví fotku už uloženého záznamu (stabilní funkce → jde dát do závislostí efektu)
    const setOriginalPhoto = useCallback((url: string | null | undefined) => {
        originalPhotoUrlRef.current = url ?? null;
        setPhotoUrl(url ?? "");
    }, []);

    const uploadPhoto = async (file: File) => {
        // Uloží si původní URL fotky, aby po úspěšném nahrání nové byla smazána
        const oldPhotoUrl = photoUrl;

        // Okamžitý lokální náhled (bez čekání na upload)
        setPhotoUrl(URL.createObjectURL(file));
        setIsUploading(true);

        try {
            // Zmenší fotku v telefonu (rychlejší upload, HEIC → JPEG)
            const resized = await resizeImageForUpload(file);
            const uploadData = new FormData();
            uploadData.append("file", resized, "photo.jpg");
            const response = await api.post("/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Smaže předchozí nahranou fotku ze serveru (fotku uloženého záznamu až po uložení)
            if (isLocalPhoto(oldPhotoUrl) && oldPhotoUrl !== originalPhotoUrlRef.current) {
                api.delete("/upload", { data: { url: oldPhotoUrl } }).catch(console.error);
            }

            const newUrl = response.data.url;
            uploadedPhotoUrlRef.current = newUrl; // Uloží pro případný cleanup při odchodu

            // Nahradí lokální preview skutečnou URL ze serveru
            setPhotoUrl(newUrl);
        } catch (err: any) {
            console.error("Chyba při nahrávání fotky:", err);
            setPhotoUrl(oldPhotoUrl);
            const message = err.response?.status === 413
                ? "Fotka je příliš velká."
                : err.response?.data?.detail || "Nepodařilo se nahrát fotku. Zkus to znovu.";
            showToast(message, "error");
        } finally {
            setIsUploading(false);
        }
    };

    // Volá se po úspěšném uložení formuláře
    const commitPhoto = () => {
        // Fotka patří k uloženému záznamu → cleanup ji při odchodu nesmí smazat
        isSubmittedRef.current = true;

        // Nová fotka je uložená → stará fotka záznamu už není potřeba
        const originalPhotoUrl = originalPhotoUrlRef.current;
        if (isLocalPhoto(originalPhotoUrl) && originalPhotoUrl !== photoUrl) {
            api.delete("/upload", { data: { url: originalPhotoUrl } }).catch(console.error);
        }
    };

    return { photoUrl, isUploading, uploadPhoto, setOriginalPhoto, commitPhoto };
}
