"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUsers, updateUser, getUser } from "@/lib/litellm";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "pevznergo@gmail.com";

function isAdmin(email?: string | null) {
    return email === ADMIN_EMAIL;
}

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
