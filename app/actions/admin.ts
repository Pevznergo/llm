"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels, createModel, LiteLLMModel, updateUser, getUser, deleteModel, listKeys } from "@/lib/litellm";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Admin check helper
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email || email !== "pevznergo@gmail.com") { // Simple check matching Sidebar logic
        throw new Error("Unauthorized: Admin access required");
    }
    return session;
}

export async function getTemplateModels() {
    await checkAdmin();
    try {
        const models = await getModels();
        return models;
    } catch (e: any) {
        console.error("Failed to fetch template models:", e);
        return [];
    }
}

export async function getModelTemplates() {
    await checkAdmin();
    try {
        const templates = await sql`SELECT * FROM model_templates ORDER BY created_at DESC`;
        return { success: true, templates };
    } catch (e: any) {
        console.error("Failed to fetch model templates:", e);
        return { success: false, error: e.message, templates: [] };
    }
}

export async function addModelTemplate(templateName: string, provider: string) {
    await checkAdmin();
    try {
        await sql`
            INSERT INTO model_templates (template_name, provider) 
            VALUES (${templateName}, ${provider})
            ON CONFLICT (template_name) DO NOTHING
        `;
        revalidatePath("/admin/add-credentials");
        return { success: true };
    } catch (e: any) {
        console.error("Failed to add model template:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteModelTemplate(id: number) {
    await checkAdmin();
    try {
        await sql`DELETE FROM model_templates WHERE id = ${id}`;
        revalidatePath("/admin/add-credentials");
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete model template:", e);
        return { success: false, error: e.message };
    }
}

// ---- Provider Credentials Management ----

export async function getProviderCredentials() {
    await checkAdmin();
    try {
        const credentials = await sql`SELECT id, provider, alias, created_at FROM provider_credentials ORDER BY created_at DESC`;
        // Intentionally not returning the raw api_key to the frontend for security, except maybe masked if needed.
        return { success: true, credentials };
    } catch (e: any) {
        console.error("Failed to fetch provider credentials:", e);
        return { success: false, error: e.message, credentials: [] };
    }
}

export async function addProviderCredential(provider: string, alias: string, apiKey: string) {
    await checkAdmin();
    if (!provider || !alias || !apiKey) {
        return { success: false, error: "Provider, alias, and API key are required." };
    }
    try {
        await sql`
            INSERT INTO provider_credentials (provider, alias, api_key) 
            VALUES (${provider}, ${alias}, ${apiKey})
        `;
        revalidatePath("/admin/add-credentials");
        return { success: true };
    } catch (e: any) {
        console.error("Failed to add provider credential:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteProviderCredential(id: number) {
    await checkAdmin();
    try {
        await sql`DELETE FROM provider_credentials WHERE id = ${id}`;
        revalidatePath("/admin/add-credentials");
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete provider credential:", e);
        return { success: false, error: e.message };
    }
}

export async function bulkCreateModels(
    credentialId: number,
    templateNames: string[],
    provider: string,
    apiBase?: string
) {
    await checkAdmin();

    if (!credentialId || !templateNames.length) {
        return { success: false, error: "Source credential and templates are required" };
    }

    // Fetch the raw API key from DB
    const credRows = await sql`SELECT api_key FROM provider_credentials WHERE id = ${credentialId}`;
    if (credRows.length === 0) {
        return { success: false, error: "Provider credential not found in database." };
    }
    const rawApiKey = credRows[0].api_key;

    const results = [];

    // Iterate and create
    for (const templateName of templateNames) {
        if (!templateName.trim()) continue;

        try {
            const newParams: any = {};
            if (rawApiKey.trim()) {
                newParams.api_key = rawApiKey.trim();
            }
            if (apiBase?.trim()) {
                newParams.api_base = apiBase.trim();
            }

            // Set custom provider if it's custom. Otherwise litellm implies it from model_name prefix.
            if (provider === 'custom') {
                newParams.custom_llm_provider = "custom";
            } else {
                newParams.default_provider = provider;
            }

            const newModelConfig = {
                model_name: templateName,
                litellm_params: newParams,
                model_info: {
                    id: templateName,
                    db_model: true
                }
            };

            await createModel(newModelConfig);
            results.push({ name: templateName, status: "created" });

        } catch (e: any) {
            console.error(`Failed to create model ${templateName}...`, e);
            results.push({ name: templateName, status: "failed", error: e.message });
        }
    }

    revalidatePath("/admin/add-credentials");
    revalidatePath("/models");
    return { success: true, results };
}

export async function getAllKeysWithDetails() {
    await checkAdmin();
    // LiteLLM doesn't have a simple "list ALL keys" for all users in one go via standard client often,
    // but the /key/list without user_id might work if Master Key is used.
    // Let's try listing for the admin first, or list all users then all keys.
    // lib/litellm.ts `listKeys` takes email.

    // Strategy: List all users, then fetch keys for each.
    const { listUsers, listKeys } = await import("@/lib/litellm");
    const users = await listUsers();

    let allKeys: any[] = [];

    // Parallel fetch
    // Limit concurrency if needed, but for now simple promise.all
    const userKeyPromises = users.map(u => listKeys(u.user_id).catch(() => []));
    const results = await Promise.all(userKeyPromises);

    results.forEach(keys => {
        if (Array.isArray(keys)) {
            allKeys = [...allKeys, ...keys];
        }
    });

    // Also fetch keys for "empty" user if possible? 
    // Usually keys are attached to users.

    return allKeys;
}

export async function assignKeyToUser(key: string, user_id: string) {
    await checkAdmin();
    try {
        const { updateKey } = await import("@/lib/litellm");
        await updateKey(key, { user_id: user_id });
        revalidatePath("/admin/keys");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAllUsers() {
    await checkAdmin();
    try {
        const { listUsers } = await import("@/lib/litellm");
        const llmUsers = await listUsers();

        // Fetch users from local DB
        const pgUsers = await sql`SELECT * FROM "User"`;

        // Merge them
        const userMap = new Map();

        // Add LiteLLM users first
        llmUsers.forEach(u => {
            userMap.set(u.email, u);
        });

        // Add PG users if they don't exist and enrich existing ones with names
        pgUsers.forEach((pu: any) => {
            if (!userMap.has(pu.email)) {
                userMap.set(pu.email, {
                    user_id: pu.email,
                    email: pu.email,
                    name: pu.name,
                    max_budget: 1.0, // Default baseline matching LiteLLM defaults
                    spend: 0,
                    request_count: 0,
                });
            } else {
                const existing = userMap.get(pu.email);
                existing.name = pu.name || existing.name;
            }
        });

        const mergedUsers = Array.from(userMap.values());

        return { users: mergedUsers, error: undefined };
    } catch (e: any) {
        return { users: [], error: e.message };
    }
}

export async function updateUserFunds(
    email: string,
    amount: number,
    operation: "add" | "set" | "subtract"
) {
    await checkAdmin();
    try {
        let newBudget = amount;

        if (operation === "add" || operation === "subtract") {
            const user = await getUser(email);
            const currentBudget = user.max_budget || 0;
            newBudget = operation === "add" ? currentBudget + amount : currentBudget - amount;
        }

        await updateUser(email, { max_budget: newBudget });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (e: any) {
        console.error("Failed to update user funds:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteAdminModel(id: string) {
    await checkAdmin();
    try {
        await deleteModel(id);
        revalidatePath("/admin/add-credentials");
        revalidatePath("/models");
        return { success: true };
    } catch (e: any) {
        console.error(`Failed to delete model ${id}:`, e);
        return { success: false, error: e.message };
    }
}

export async function updateAdminModel(id: string, updates: any) {
    await checkAdmin();
    try {
        // LiteLLM update model usually works via /model/update if it exists, or re-POSTing to /model/new can sometimes overwrite it depending on config.
        // It's safer to use the proper litellm api (or if they rely on db model creation, /model/new can update an existing key if it matches id, or there is an explicit /model/update endpoint but we haven't wrapped it yet)

        // Wait, looking at litellm proxy, to update a model you use POST /model/new with same model_name and updated litellm_params.
        const modelConfig = {
            model_name: id,
            litellm_params: updates,
            model_info: {
                id: id,
                db_model: true
            }
        };

        await createModel(modelConfig);
        revalidatePath("/admin/add-credentials");
        revalidatePath("/models");
        return { success: true };
    } catch (e: any) {
        console.error(`Failed to update model ${id}:`, e);
        return { success: false, error: e.message };
    }
}

// --- Key Management Actions ---

export async function adminGetAllKeys() {
    await checkAdmin();
    try {
        const { listUsers, listKeys } = await import("@/lib/litellm");
        const users = await listUsers();
        let allKeys: any[] = [];
        const userKeyPromises = users.map(u => listKeys(u.user_id).catch(() => []));
        const results = await Promise.all(userKeyPromises);
        results.forEach(keys => {
            if (Array.isArray(keys)) {
                allKeys = [...allKeys, ...keys];
            }
        });
        return { success: true, keys: allKeys };
    } catch (e: any) {
        console.error("Failed to list all keys:", e);
        return { success: false, error: e.message, keys: [] };
    }
}

export async function adminGenerateKey(email: string, budget?: number, alias?: string) {
    await checkAdmin();
    try {
        const { generateKey } = await import("@/lib/litellm");
        // Ensure user exists or use admin email
        const targetEmail = email || "pevznergo@gmail.com";
        const newKey = await generateKey(targetEmail, budget, alias);
        revalidatePath("/admin/add-credentials");
        revalidatePath("/keys");
        return { success: true, key: newKey };
    } catch (e: any) {
        console.error("Failed to generate key:", e);
        return { success: false, error: e.message };
    }
}

export async function adminDeleteKey(keyHash: string) {
    await checkAdmin();
    try {
        const { deleteKey } = await import("@/lib/litellm");
        await deleteKey(keyHash);
        revalidatePath("/admin/add-credentials");
        revalidatePath("/keys");
        return { success: true };
    } catch (e: any) {
        console.error(`Failed to delete key ${keyHash}:`, e);
        return { success: false, error: e.message };
    }
}

export async function adminUpdateKey(keyHash: string, updates: any) {
    await checkAdmin();
    try {
        const { updateKey } = await import("@/lib/litellm");
        await updateKey(keyHash, updates);
        revalidatePath("/admin/add-credentials");
        revalidatePath("/keys");
        return { success: true };
    } catch (e: any) {
        console.error(`Failed to update key ${keyHash}:`, e);
        return { success: false, error: e.message };
    }
}
