"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUsers, updateUser, getUser, listKeys, getKeyInfo, updateKey } from "@/lib/litellm";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "pevznergo@gmail.com";

function isAdmin(email?: string | null) {
    return email === ADMIN_EMAIL;
}

// Admin check middleware (placeholder from old file, updated to check email)
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.email)) {
        throw new Error("Unauthorized");
    }
    return session.user.email;
}

// --- User Management Actions ---

export async function getAllUsers() {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.email)) {
        return { error: "Unauthorized" };
    }

    const users = await listUsers();
    return { users };
}

export async function updateUserFunds(targetEmail: string, amount: number, operation: "add" | "set" | "subtract") {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.email)) {
        return { error: "Unauthorized" };
    }

    try {
        // 1. Get current user info to know current budget
        const user = await getUser(targetEmail);
        let currentBudget = user.max_budget || 0;

        // 2. Calculate new budget
        let newBudget = currentBudget;
        if (operation === "add") {
            newBudget += amount;
        } else if (operation === "subtract") {
            newBudget = Math.max(0, currentBudget - amount);
        } else if (operation === "set") {
            newBudget = amount;
        }

        // 3. Update user
        await updateUser(targetEmail, { max_budget: newBudget });

        revalidatePath("/admin/users");
        return { success: true, newBudget };
    } catch (error: any) {
        console.error("Failed to update funds:", error);
        return { error: error.message || "Failed to update funds" };
    }
}

// --- Key Management Actions (Restored) ---

export async function getAllKeysWithDetails() {
    await checkAdmin();

    // First get all key hashes
    const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000";
    const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || process.env.APORTO_API_KEY || "";

    try {
        const res = await fetch(`${LITELLM_BASE_URL}/key/list`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LITELLM_MASTER_KEY}`
            }
        });

        if (!res.ok) {
            console.error("Failed to fetch keys list:", await res.text());
            return [];
        }

        const data = await res.json();
        const keyHashes: string[] = data.keys || [];

        // Fetch details for each key (in parallel)
        const detailsPromises = keyHashes.map(hash => getKeyInfo(hash));
        const details = await Promise.all(detailsPromises);

        return keyHashes.map((hash, index) => {
            const k = details[index];
            if (!k) return null;
            return {
                ...k,
                key: k.key || k.token || hash, // Ensure key is present
                key_alias: k.key_alias || k.key_name
            };
        }).filter(k => k !== null);
    } catch (e) {
        console.error("Failed to fetch all keys:", e);
        return [];
    }
}

export async function assignKeyToUser(key: string, email: string) {
    console.log(`[Admin] Assigning key ${key.substring(0, 10)}... to user ${email}`);
    await checkAdmin();
    try {
        const result = await updateKey(key, { user_id: email });
        console.log(`[Admin] Key updated successfully:`, result);
        return result;
    } catch (e: any) {
        console.error(`[Admin] Failed to update key:`, e);
        throw new Error(e.message || "Failed to update key");
    }
}
