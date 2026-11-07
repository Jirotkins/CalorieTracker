// Formátuje Date objekt na "YYYY-MM-DD" v LOKÁLNÍM čase
// (toISOString() vrací UTC, takže v ČR kolem půlnoci posune datum o den zpět)
export function toLocalDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

// Převede "YYYY-MM-DD" na Date v lokálním čase (půlnoc). Neplatný vstup → null.
export function parseLocalDate(value: string | null): Date | null {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return null
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

// Nový Date posunutý o daný počet dní
export function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

// Pondělí týdne, do kterého datum patří (český týden začíná pondělím)
export function startOfWeek(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const daysFromMonday = (result.getDay() + 6) % 7
    return addDays(result, -daysFromMonday)
}
