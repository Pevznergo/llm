"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels, createModel, LiteLLMModel } from "@/lib/litellm";
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

export async function bulkCreateModels(
    provider: string,
    keys: string[],
    templateModelId: string
) {
    await checkAdmin();

    // 1. Fetch template details
    const models = await getModels();
    const template = models.find(m => m.id === templateModelId);

    if (!template) {
        return { success: false, error: "Template model not found" };
    }

    const results = [];

    // 2. Iterate and create
    for (const key of keys) {
        if (!key.trim()) continue;

        // Generate a unique suffix or name. 
        // Simple strategy: append first 4 chars of key to avoid full key exposure in name if we were to usage it,
        // but better to usage random suffix or just counter if keys are identical? 
        // User didn't specify, but usually one model per key means we need distinct IDs.
        // Let's usage a random suffix for uniqueness.
        const suffix = Math.random().toString(36).substring(2, 7);
        const newModelName = `${template.id}-copy-${suffix}`;

        try {
            // Construct new model config
            // We use the template's params but override the key.
            const baseParams = template.litellm_params || {};

            // If template doesn't have params, we can't clone safely.
            // But if it's a proxy model, it MUST have params linking to a provider.

            const newParams = { ...baseParams };

            // Inject the key based on provider
            // Common param for key is 'api_key' but some providers usage env vars.
            // We'll set 'api_key' in params as it overrides env vars usually.
            if (key.trim()) {
                newParams.api_key = key.trim();
            }

            // Ensure model name in destination is set
            // If we are cloning a proxy model, `model` param usually points to the upstream identifier (e.g. gpt-4)
            // We keep that.

            const newModelConfig = {
                model_name: newModelName,
                litellm_params: newParams,
                model_info: {
                    id: newModelName,
                    db_model: true // Persistence
                }
            };

            await createModel(newModelConfig);
            results.push({ name: newModelName, status: "created" });

        } catch (e: any) {
            console.error(`Failed to create model for key ${key.substring(0, 5)}...`, e);
            results.push({ name: newModelName, status: "failed", error: e.message });
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

        export async function getAllUsers() {
            await checkAdmin();
            const { listUsers } = await import("@/lib/litellm");
            return await listUsers();
        }
