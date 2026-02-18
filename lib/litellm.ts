
// Real LiteLLM Proxy API Integration
// Connects to LiteLLM proxy running on localhost:4000

const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000";
const LITELLM_MASTER_KEY = process.env.APORTO_API_KEY || "";

async function litellmFetch(path: string, options: RequestInit = {}) {
    const url = `${LITELLM_BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LITELLM_MASTER_KEY}`,
            ...options.headers,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`LiteLLM API error ${res.status} for ${path}:`, text);
        throw new Error(`LiteLLM API error: ${res.status}`);
    }

    return res.json();
}

export interface LiteLLMUser {
    user_id: string;
    email: string;
    max_budget?: number;
    spend: number;
    user_role?: string;
    request_count: number;
}

export interface LiteLLMKey {
    key_alias?: string;
    key: string;
    token?: string;
    spend: number;
    max_budget?: number;
}

export async function getUser(email: string): Promise<LiteLLMUser> {
    try {
        const data = await litellmFetch(`/user/info?user_id=${encodeURIComponent(email)}`);
        const info = data.user_info || data;
        return {
            user_id: info.user_id || email,
            email: email,
            max_budget: info.max_budget,
            spend: info.spend || 0,
            user_role: info.user_role,
            request_count: info.request_count || 0,
        };
    } catch (e: any) {
        // If user doesn't exist in LiteLLM, create them
        if (e.message.includes("404") || e.message.includes("400")) {
            try {
                await litellmFetch("/user/new", {
                    method: "POST",
                    body: JSON.stringify({
                        user_id: email,
                        user_email: email,
                        max_budget: 10.0,
                    }),
                });
                return {
                    user_id: email,
                    email: email,
                    max_budget: 10.0,
                    spend: 0,
                    request_count: 0,
                };
            } catch (createErr) {
                console.error("Failed to create LiteLLM user:", createErr);
            }
        }
        // Return defaults if all fails
        return {
            user_id: email,
            email: email,
            max_budget: 10.0,
            spend: 0,
            request_count: 0,
        };
    }
}

export async function listKeys(email: string): Promise<LiteLLMKey[]> {
    try {
        const data = await litellmFetch(`/key/list?user_id=${encodeURIComponent(email)}`);
        const keys = data.keys || data || [];
        return Array.isArray(keys) ? keys.map((k: any) => ({
            key_alias: k.key_alias || k.key_name,
            key: k.key || k.token || "",
            token: k.token,
            spend: k.spend || 0,
            max_budget: k.max_budget,
        })) : [];
    } catch {
        return [];
    }
}

export async function generateKey(email: string, budget?: number, alias?: string): Promise<string> {
    const data = await litellmFetch("/key/generate", {
        method: "POST",
        body: JSON.stringify({
            user_id: email,
            key_alias: alias || undefined,
            max_budget: budget || undefined,
            duration: undefined,
        }),
    });

    return data.key || data.token || "";
}

export interface LiteLLMModel {
    id: string;
    object: string;
    created: number;
    owned_by: string;
}

export async function getModels(): Promise<LiteLLMModel[]> {
    try {
        const data = await litellmFetch("/v1/models");
        const models = data.data || data || [];
        return Array.isArray(models) ? models.map((m: any) => ({
            id: m.id || m.model_name,
            object: m.object || "model",
            created: m.created || 0,
            owned_by: m.owned_by || "unknown",
        })) : [];
    } catch {
        return [];
    }
}
// ... existing code ...

export async function getKeyInfo(key: string): Promise<any> {
    try {
        const data = await litellmFetch(`/key/info?key=${key}`);
        return data.info || data;
    } catch {
        return null;
    }
}

export async function updateKey(key: string, updates: any): Promise<any> {
    try {
        const data = await litellmFetch("/key/update", {
            method: "POST",
            body: JSON.stringify({
                key: key,
                ...updates
            })
        });
        return data;
    } catch (e: any) {
        throw new Error(e.message);
    }
}
