"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels, createModel, LiteLLMModel, updateUser, getUser } from "@/lib/litellm";
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
    templateModelId: string,
    options?: {
        apiBase?: string;
        customProvider?: string;
    }
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

        const suffix = Math.random().toString(36).substring(2, 7);
        const newModelName = `${template.id}-copy-${suffix}`;

        try {
            const baseParams = template.litellm_params || {};
            const newParams = { ...baseParams };

            if (key.trim()) {
                newParams.api_key = key.trim();
            }

            if (options?.apiBase) {
                newParams.api_base = options.apiBase;
            }

            if (options?.customProvider) {
                // If custom provider is set, we might need it in the 'model' string or custom_llm_provider
                newParams.custom_llm_provider = options.customProvider;
            }

            const newModelConfig = {
                model_name: newModelName,
                litellm_params: newParams,
                model_info: {
                    id: newModelName,
                    db_model: true
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
