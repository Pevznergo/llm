"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listKeys } from "@/lib/litellm";

export async function getRequestLogs(page = 1, limit = 50) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { error: "Unauthorized" };
    }

    const email = session.user.email;

    // Get user's keys to filter logs
    const keys = await listKeys(email);
    const keyHashes = keys.map(k => k.key).filter(Boolean);

    if (keyHashes.length === 0) {
        return { logs: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    try {
        // Query logs matching the user's keys using ANY operator for array comparison
        // Note: sql`...` automatically handles array to parameter conversion for IN clause 
        // but typically requires sql`... WHERE x IN ${sql(array)}` pattern in some libraries
        // standard pg client usage: WHERE api_key = ANY(${keyHashes})

        const logs = await sql`
            SELECT 
                request_id,
                "startTime",
                model,
                "total_tokens",
                prompt_tokens,
                completion_tokens,
                "spend",
                status
            FROM "LiteLLM_SpendLogs"
            WHERE api_key = ANY(${keyHashes})
            ORDER BY "startTime" DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        // Get total count for pagination
        const countResult = await sql`
            SELECT COUNT(*) as count
            FROM "LiteLLM_SpendLogs"
            WHERE api_key = ANY(${keyHashes})
        `;

        const total = parseInt(countResult[0].count);

        return {
            logs: logs.map(log => ({
                ...log,
                startTime: log.startTime || log.starttime,
                total_tokens: log.total_tokens,
                spend: log.spend
            })),
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return { logs: [], total: 0, error: "Failed to fetch logs" };
    }
}

export async function getDailyStats() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { error: "Unauthorized" };
    }

    const email = session.user.email;
    const keys = await listKeys(email);
    const keyHashes = keys.map(k => k.key).filter(Boolean);

    if (keyHashes.length === 0) {
        return { dailyStats: [] };
    }

    try {
        const stats = await sql`
            SELECT 
                DATE("startTime") as date,
                SUM("spend") as spend,
                COUNT(*) as requests,
                SUM("total_tokens") as tokens
            FROM "LiteLLM_SpendLogs"
            WHERE api_key = ANY(${keyHashes})
            AND "startTime" > NOW() - INTERVAL '30 days'
            GROUP BY DATE("startTime")
            ORDER BY DATE("startTime") ASC
        `;

        return { dailyStats: stats };
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return { dailyStats: [], error: "Failed to fetch stats" };
    }
}
