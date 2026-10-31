// Formátuje Date objekt na "YYYY-MM-DD" v LOKÁLNÍM čase
// (toISOString() vrací UTC, takže v ČR kolem půlnoci posune datum o den zpět)
export function toLocalDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
