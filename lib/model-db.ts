import { sql } from "@/lib/db";

export interface ModelDescription {
    model_id: string;
    display_name: string;
    description: string;
    provider_alias: string;
}

export async function getModelDescriptions(): Promise<Record<string, ModelDescription>> {
    try {
        // The sql tag function returns 'any', usually rows array
        const rows = await sql`SELECT * FROM model_descriptions`;

        const map: Record<string, ModelDescription> = {};
        if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
                map[row.model_id] = {
                    model_id: row.model_id,
                    display_name: row.display_name,
                    description: row.description,
                    provider_alias: row.provider_alias
                };
            });
        }
        return map;
    } catch (e) {
        console.error("Failed to fetch model descriptions from DB:", e);
        return {};
    }
}
