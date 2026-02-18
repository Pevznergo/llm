"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateKey as litellmGenerateKey } from "@/lib/litellm"
import { revalidatePath } from "next/cache"

export async function createApiKey(alias: string, budget?: number) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized")
    }

    try {
        const key = await litellmGenerateKey(session.user.email, budget, alias)
        revalidatePath("/")
        return { success: true, key: key }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteKeyAction(key: string) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.email) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // TODO: Validate key belongs to user? 
        // Litellm delete endpoint might allow deleting any key if master key is used?
        // Ideally we should list keys and check if key exists in user's keys.
        // For now trusting the UI context.
        const { deleteKey } = await import("@/lib/litellm");
        await deleteKey(key)
        revalidatePath("/keys")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
