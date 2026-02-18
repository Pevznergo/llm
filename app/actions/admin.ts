"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listKeys, getKeyInfo, updateKey } from "@/lib/litellm";

// Admin check middleware (placeholder)
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        throw new Error("Unauthorized");
    }
    // TODO: Add actual admin check here (e.g. check DB role or env var)
    // const admins = process.env.ADMIN_EMAILS?.split(',') || [];
    // if (!admins.includes(session.user.email)) throw new Error("Forbidden");
    return session.user.email;
}

export async function getAllKeysWithDetails() {
    await checkAdmin();

    // First get all key hashes
    const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000";
    const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || process.env.APORTO_API_KEY || "";

    try {
        const res = await fetch(`${LITELLM_BASE_URL}/key/list`, {
            headers: { "Authorization": `Bearer ${LITELLM_MASTER_KEY}` }
        });
        const data = await res.json();
        const keyHashes: string[] = data.keys || [];

        // Fetch details for each key (in parallel)
        const detailsPromises = keyHashes.map(hash => getKeyInfo(hash));
        const details = await Promise.all(detailsPromises);

        return details.filter(k => k !== null);
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
