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
