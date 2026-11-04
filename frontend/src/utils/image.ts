// Maximální delší strana fotky před uploadem (server ji pak zmenší na 800 px)
const MAX_UPLOAD_DIMENSION = 1600
const JPEG_QUALITY = 0.85

// Zmenší fotku v telefonu a převede ji na JPEG ještě před odesláním.
// Fotka z foťáku má i 5 MB → po zmenšení cca 200–400 kB (rychlejší upload, méně dat).
// Safari umí dekódovat i HEIC, takže výsledkem je vždy JPEG, kterému server rozumí.
// Pokud se zmenšení nepovede, vrátí původní soubor.
export async function resizeImageForUpload(file: File): Promise<Blob> {
    const objectUrl = URL.createObjectURL(file)
    try {
        const image = new Image()
        image.src = objectUrl
        await image.decode()

        const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(image.naturalWidth * scale)
        canvas.height = Math.round(image.naturalHeight * scale)

        const context = canvas.getContext("2d")
        if (!context) return file
        // Prohlížeč při kreslení automaticky aplikuje EXIF otočení
        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY))
        return blob ?? file
    } catch (error) {
        console.error("Fotku se nepodařilo zmenšit, posílám originál:", error)
        return file
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}
