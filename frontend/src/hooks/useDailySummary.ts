import { useState, useEffect } from "react"
import { api } from "../services/api"
import { type DailySummary } from "../types/meal"

// Formátuje Date objekt na "YYYY-MM-DD" string pro API
function formatDate(date: Date): string {
    return date.toISOString().split("T")[0]
}

// Hook který fetchuje denní souhrn pro zadané datum z API
// refreshKey: zvýšení hodnoty vynutí nový fetch (používá Dashboard po zalogování jídla)
export function useDailySummary(date: Date, refreshKey: number = 0) {
    const [data, setData] = useState<DailySummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Resetujeme stav při změně data (zabrání zobrazení starých dat)
        setIsLoading(true)
        setError(null)

        const dateStr = formatDate(date)

        api.get<DailySummary>(`/logs/date/${dateStr}`)
            .then((res) => {
                setData(res.data)
            })
            .catch(() => {
                setError("Nepodařilo se načíst data pro tento den.")
            })
            .finally(() => {
                setIsLoading(false)
            })

    }, [date.toDateString(), refreshKey]) // Závislost — re-fetch při změně dne NEBO refreshKey

    return { data, isLoading, error }
}
