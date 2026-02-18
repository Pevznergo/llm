"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listKeys } from "@/lib/litellm";

import { eachDayOfInterval, format, subDays, startOfDay, endOfDay } from "date-fns";

export async function getRequestLogs(page = 1, limit = 50, startDate?: string, endDate?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { error: "Unauthorized" };
    }

    const email = session.user.email;
    const keys = await listKeys(email);
    const keyHashes = keys.map(k => k.key).filter(Boolean);

    if (keyHashes.length === 0) {
        return { logs: [], total: 0, totalPages: 0 };
    }

    const offset = (page - 1) * limit;

    // Date filtering logic
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subDays(end, 7));

    try {
        const logs = await sql`
            SELECT 
                request_id,
                "startTime",
                "endTime",
                model,
                "total_tokens",
                prompt_tokens,
                completion_tokens,
                "spend",
                status,
                user_id,
                metadata,
                api_base
            FROM "LiteLLM_SpendLogs"
            WHERE api_key = ANY(${keyHashes})
            AND "startTime" >= ${start.toISOString()}
            AND "startTime" <= ${end.toISOString()}
            ORDER BY "startTime" DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countResult = await sql`
            SELECT COUNT(*) as count
            FROM "LiteLLM_SpendLogs"
            WHERE api_key = ANY(${keyHashes})
            AND "startTime" >= ${start.toISOString()}
            AND "startTime" <= ${end.toISOString()}
        `;

        const total = parseInt(countResult[0].count);

        return {
            logs: logs.map(log => {
                const start = new Date(log.startTime || log.starttime);
                const end = log.endTime ? new Date(log.endTime) : null;
                const latency = end ? end.getTime() - start.getTime() : 0;

                return {
                    ...log,
                    startTime: start.toISOString(),
                    model: log.model,
                    total_tokens: log.total_tokens,
                    prompt_tokens: log.prompt_tokens || 0,
                    completion_tokens: log.completion_tokens || 0,
                    spend: log.spend || 0,
                    status: log.status,
                    latency,
                    app: log.user_id || "Unknown",
                    provider: log.api_base || "Unknown" // Crude approximation
                };
            }),
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return { logs: [], total: 0, totalPages: 0, error: "Failed to fetch logs" };
    }
}

export async function getLogsStats(startDate?: string, endDate?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { chartData: [] };
    }

    const email = session.user.email;
    const keys = await listKeys(email);
    const keyHashes = keys.map(k => k.key).filter(Boolean);

    if (keyHashes.length === 0) {
        return { chartData: [] };
    }

    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subDays(end, 7));

    try {
        const stats = await sql`
            SELECT 
                DATE("startTime") as date,
                COUNT(*) as count,
                SUM("spend") as spend
            FROM "LiteLLM_SpendLogs"
            WHERE api_key = ANY(${keyHashes})
            AND "startTime" >= ${start.toISOString()}
            AND "startTime" <= ${end.toISOString()}
            GROUP BY DATE("startTime")
            ORDER BY DATE("startTime") ASC
        `;

        // Fill in missing days with 0
        const interval = eachDayOfInterval({ start, end });
        const chartData = interval.map(date => {
            const dateStr = format(date, "yyyy-MM-dd");
            const stat = stats.find((s: any) => {
                // pg returns date object or string depending on driver/config
                const sDate = new Date(s.date).toISOString().split('T')[0];
                return sDate === dateStr;
            });
            return {
                date: dateStr,
                count: stat ? parseInt(stat.count) : 0,
                spend: stat ? parseFloat(stat.spend) : 0
            };
        });

        return { chartData };
    } catch (error) {
        console.error("Failed to fetch log stats:", error);
        return { chartData: [] };
    }
}

export async function getDailyStats() {
    // Kept for backward compatibility if needed, but getLogsStats is better
    return getLogsStats();
}
