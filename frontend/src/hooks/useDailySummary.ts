import { useState, useEffect } from "react"
import { api } from "../services/api"
import { type DailySummary } from "../types/meal"
import { toLocalDateString } from "../utils/date"

// Hook který fetchuje denní souhrn pro zadané datum z API
// refreshKey: zvýšení hodnoty vynutí nový fetch (používá Dashboard po zalogování jídla)
export function useDailySummary(date: Date, refreshKey: number = 0) {
    const dateStr = toLocalDateString(date)
    const [data, setData] = useState<DailySummary | null>(null)
    // Pro který den jsou data v `data` (při změně dne se stará data nezobrazí)
    const [dataDate, setDataDate] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Odpověď na už neaktuální den (rychlé přepínání) se zahodí
        let isCancelled = false
        setIsLoading(true)
        setError(null)

        api.get<DailySummary>(`/logs/date/${dateStr}`)
            .then((res) => {
                if (isCancelled) return
                setData(res.data)
                setDataDate(dateStr)
            })
            .catch(() => {
                if (!isCancelled) setError("Nepodařilo se načíst data pro tento den.")
            })
            .finally(() => {
                if (!isCancelled) setIsLoading(false)
            })

        return () => { isCancelled = true }
    }, [dateStr, refreshKey]) // Re-fetch při změně dne NEBO refreshKey

    // Po zalogování (stejný den) zůstanou stará data vidět, dokud nepřijdou nová → žádné problikávání
    return { data: dataDate === dateStr ? data : null, isLoading, error }
}
