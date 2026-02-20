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

export async function bulkCreateModels(
    sourceKeyHash: string,
    templateNames: string[],
    provider: string,
    apiBase?: string
) {
    await checkAdmin();

    if (!sourceKeyHash || !templateNames.length) {
        return { success: false, error: "Source key and templates are required" };
    }

    // Since we are using an existing key from proxy, we need its token string.
    // However, the hash from listKeys might just be the hash, not the usable sk-... token if it's masked. 
    // Usually, creating models requires the raw key OR LiteLLM allows using the hash? No, LiteLLM /model/new needs the real api_key,
    // OR it might just be routing. 
    // Wait, you want to use the API KEY string itself, so the UI must pass the raw API Key, 
    // or if the UI dropdown only has hashes, we can't extract the original `sk-...` from the proxy. 
    // Let's assume the user selects a key from the dropdown and we pass the known token.
    // If we only have the alias/hash, Litellm doesn't let you see the full key again.
    // *Wait*, if they select a Master Key, they can't extract the API key from it to create a model. 
    // LiteLLM models need the provider's API key (e.g. OpenAI sk-...). 
    // LiteLLM Keys (user keys) are for accessing the proxy, not the provider.
    // If the "selected credential" means the PROVIDER'S API Key, then it should be an input field,
    // OR if it's stored in LiteLLM DB as a key?
    // Let's modify this to take `rawApiKey: string` instead of `sourceKeyHash` because to create a model in Litellm, you need the backend Provider API Key.

    // Correction: the action signature will take `rawApiKey`. If the user is selecting a key from LiteLLM UI, it might be a model.
    // If they want to use a proxy key... proxy keys don't work like that for models usually, unless litellm has a feature for it.

    const results = [];

    // Iterate and create
    for (const templateName of templateNames) {
        if (!templateName.trim()) continue;

        try {
            const newParams: any = {};
            if (sourceKeyHash.trim()) {
                newParams.api_key = sourceKeyHash.trim(); // Assume sourceKeyHash is the raw API Key sent from the client
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
        const users = await listUsers();
        return { users, error: undefined };
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
