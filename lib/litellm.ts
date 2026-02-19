
// Real LiteLLM Proxy API Integration
// Connects to LiteLLM proxy running on localhost:4000

const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000";
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || process.env.APORTO_API_KEY || "";

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
                        max_budget: 1.0,
                    }),
                });
                return {
                    user_id: email,
                    email: email,
                    max_budget: 1.0,
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
            max_budget: 1.0,
            spend: 0,
            request_count: 0,
        };
    }
}

export async function listKeys(email: string): Promise<LiteLLMKey[]> {
    try {
        const data = await litellmFetch(`/key/list?user_id=${encodeURIComponent(email)}`);
        const keys = data.keys || data || [];

        if (!Array.isArray(keys)) return [];

        // If keys are strings (hashes), fetch details for each
        if (keys.length > 0 && typeof keys[0] === 'string') {
            const detailsPromises = keys.map(hash => getKeyInfo(hash));
            const details = await Promise.all(detailsPromises);

            return keys.map((hash: string, index: number) => {
                const k = details[index];
                if (!k) return null;
                return {
                    key_alias: k.key_alias || k.key_name,
                    key: k.key || k.token || hash,
                    token: k.token || hash,
                    spend: k.spend || 0,
                    max_budget: k.max_budget,
                };
            }).filter((item: any) => item !== null) as LiteLLMKey[];
        }

        return keys.map((k: any) => ({
            key_alias: k.key_alias || k.key_name,
            key: k.key || k.token || "",
            token: k.token,
            spend: k.spend || 0,
            max_budget: k.max_budget,
        }));
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
    input_cost_per_token?: number;
    output_cost_per_token?: number;
    max_input_tokens?: number;
    max_output_tokens?: number;
    litellm_provider?: string;
    description?: string;
    display_name?: string;
    litellm_params?: any;
}

import { getModelDescriptions } from "@/lib/model-db";

export async function getModels(): Promise<LiteLLMModel[]> {
    let dbDescriptions: Record<string, any> = {};
    try {
        dbDescriptions = await getModelDescriptions();
    } catch (e) {
        // ignore
    }

    try {
        // Try to fetch detailed info first using master key (requires LITELLM_MASTER_KEY in env)
        const detailedResponse = await litellmFetch("/model/info");
        const detailedData = detailedResponse.data || detailedResponse;

        if (Array.isArray(detailedData)) {
            return detailedData.map((m: any) => {
                const info = m.model_info || {};
                // Use key or model_name as ID (human readable), fallback to info.id
                const modelId = m.model_name || info.key || info.id;

                const dbMeta = dbDescriptions[modelId] || {};

                return {
                    id: modelId,
                    object: "model",
                    created: 0,
                    owned_by: dbMeta.provider_alias || info.litellm_provider || m.litellm_params?.custom_llm_provider || "unknown",
                    // New fields
                    input_cost_per_token: info.input_cost_per_token,
                    output_cost_per_token: info.output_cost_per_token,
                    max_input_tokens: info.max_input_tokens,
                    max_output_tokens: info.max_output_tokens,

                    litellm_provider: info.litellm_provider,
                    litellm_params: m.litellm_params,

                    // Extra DB fields
                    description: dbMeta.description,
                    display_name: dbMeta.display_name
                };
            });
        }
    } catch (e) {
        console.warn("Failed to fetch detailed model info, falling back to basic list:", e);
    }

    // Fallback to basic list
    try {
        const data = await litellmFetch("/v1/models");
        const models = data.data || data || [];
        return Array.isArray(models) ? models.map((m: any) => {
            const modelId = m.id || m.model_name;
            const dbMeta = dbDescriptions[modelId] || {};
            return {
                id: modelId,
                object: m.object || "model",
                created: m.created || 0,
                owned_by: dbMeta.provider_alias || m.owned_by || "unknown",
                description: dbMeta.description,
                display_name: dbMeta.display_name
            };
        }) : [];
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


export async function listUsers(): Promise<LiteLLMUser[]> {
    try {
        const data = await litellmFetch("/user/list");
        const users = data.users || data || [];
        if (!Array.isArray(users)) return [];

        return users.map((u: any) => ({
            user_id: u.user_id || u.user_email,
            email: u.user_email || u.user_id,
            max_budget: u.max_budget,
            spend: u.spend || 0,
            user_role: u.user_role,
            request_count: u.request_count || 0,
        }));
    } catch (e) {
        console.error("Failed to list users:", e);
        return [];
    }
}

export async function updateUser(user_id: string, updates: any): Promise<any> {
    try {
        const data = await litellmFetch("/user/update", {
            method: "POST",
            body: JSON.stringify({
                user_id: user_id,
                ...updates
            })
        });
        return data;
    } catch (e: any) {
        throw new Error(e.message);
    }
}


export async function deleteKey(key: string): Promise<any> {
    try {
        const data = await litellmFetch("/key/delete", {
            method: "POST",
            body: JSON.stringify({
                keys: [key]
            })
        });
        return data;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export async function createModel(modelConfig: any): Promise<any> {
    try {
        const data = await litellmFetch("/model/new", {
            method: "POST",
            body: JSON.stringify(modelConfig)
        });
        return data;
    } catch (e: any) {
        throw new Error(e.message);
    }
}
