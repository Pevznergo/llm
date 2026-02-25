import { sql } from "./db";

export interface ManagedModel {
    id: number;
    account?: string;
    model_name: string;
    litellm_params: any;
    model_info: any;
    daily_request_limit: number;
    requests_today: number;
    status: 'queued' | 'active' | 'exhausted' | 'archived';
    created_at: Date;
}

export async function addManagedModel(account: string | undefined | null, model_name: string, litellm_params: any, model_info: any, limit: number) {
    try {
        const result = await sql`
            INSERT INTO managed_models (account, model_name, litellm_params, model_info, daily_request_limit, requests_today, status)
            VALUES (${account || null}, ${model_name}, ${litellm_params}, ${model_info}, ${limit}, 0, 'queued')
            RETURNING *
        `;
        return result[0];
    } catch (e) {
        console.error("Failed to add managed model:", e);
        throw e;
    }
}

export async function getManagedModels() {
    try {
        const rows = await sql`SELECT * FROM managed_models ORDER BY created_at ASC`;
        return rows as ManagedModel[];
    } catch (e) {
        console.error("Failed to fetch managed models:", e);
        return [];
    }
}

export async function updateManagedModelStatus(id: number, status: string) {
    try {
        const result = await sql`UPDATE managed_models SET status = ${status} WHERE id = ${id} RETURNING *`;
        return result[0];
    } catch (e) {
        console.error("Failed to update status:", e);
        throw e;
    }
}

export async function updateRequestsToday(id: number, requests: number) {
    try {
        await sql`UPDATE managed_models SET requests_today = ${requests} WHERE id = ${id}`;
    } catch (e) {
        console.error("Failed to update requests today:", e);
    }
}

export async function resetRequestsToday() {
    try {
        await sql`UPDATE managed_models SET requests_today = 0`;
    } catch (e) {
        console.error("Failed to reset requests today:", e);
    }
}

export async function deleteManagedModel(id: number) {
    try {
        await sql`DELETE FROM managed_models WHERE id = ${id}`;
    } catch (e) {
        console.error("Failed to delete managed model:", e);
        throw e;
    }
}

export async function getActiveManagedModels() {
    return await sql`SELECT * FROM managed_models WHERE status = 'active'` as ManagedModel[];
}

export async function getQueuedManagedModels() {
    return await sql`SELECT * FROM managed_models WHERE status = 'queued' ORDER BY created_at ASC` as ManagedModel[];
}
