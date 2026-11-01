// Formátuje počet (porcí) česky: 1.5 -> "1,5", 2 -> "2"
export function formatAmount(value: number): string {
    return value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })
}
