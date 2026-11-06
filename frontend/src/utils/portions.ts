import { type FoodPortion } from "../types/food";

// Řádek porce ve formuláři (id má jen porce, která už existuje v DB)
export interface PortionRow {
    key: number;
    id?: number;
    name: string;
    weight_grams: string;
}

// Unikátní klíč pro React (nové porce ještě nemají id)
let nextPortionKey = 0;

// Porce z API → řádky formuláře
export function toPortionRows(portions: FoodPortion[]): PortionRow[] {
    return portions.map((p) => ({
        key: nextPortionKey++,
        id: p.id,
        name: p.name,
        weight_grams: String(p.weight_grams),
    }));
}

// Řádky formuláře → data pro API (id posílá jen u existujících porcí)
export function toPortionPayload(rows: PortionRow[]) {
    return rows.map((p) => ({
        id: p.id,
        name: p.name.trim(),
        weight_grams: parseInt(p.weight_grams) || 0,
    }));
}

export function hasInvalidPortion(rows: PortionRow[]): boolean {
    return rows.some((p) => !(parseInt(p.weight_grams) > 0));
}

// Klíč pro nový (prázdný) řádek porce
export function newPortionRow(): PortionRow {
    return { key: nextPortionKey++, name: "", weight_grams: "" };
}
