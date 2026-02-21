import { NextResponse } from "next/server";
import { Pool } from 'pg';

export const dynamic = "force-dynamic";
export const maxDuration = 300;

let litellmPool: Pool | undefined;
function getLitellmDb() {
    if (!litellmPool) {
        litellmPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }
    return litellmPool;
}

export async function GET(req: Request) {
    try {
        // Optional: Simple Cron Secret protection if configured
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await getLitellmDb().connect();
        try {
            // Calculate total spend for all tags currently marked as 'active'
            const result = await client.query(`
                WITH UsageData AS (
                    SELECT 
                        COALESCE(
                            (
                                SELECT SUBSTRING(tag FROM 'provider_key:(.*)') 
                                FROM jsonb_array_elements_text(
                                    CASE WHEN jsonb_typeof(m.litellm_params->'tags') = 'array' 
                                         THEN m.litellm_params->'tags' 
                                         ELSE '[]'::jsonb 
                                END
                                ) as tag 
                                WHERE tag LIKE 'provider_key:%' 
                                LIMIT 1
                            ),
                            'Untagged'
                        ) as credential_alias,
                        s.model,
                        SUM(COALESCE(s.prompt_tokens, 0)) as prompt_tokens,
                        SUM(COALESCE(s.completion_tokens, 0)) as completion_tokens,
                        MAX(COALESCE(mc.prompt_cost_per_1m, 0)) as p1m,
                        MAX(COALESCE(mc.completion_cost_per_1m, 0)) as c1m
                    FROM "LiteLLM_SpendLogs" s
                    LEFT JOIN "LiteLLM_ProxyModelTable" m 
                        ON m.model_info->>'id' = s.model_id
                    LEFT JOIN admin_key_usage_model_costs mc 
                        ON mc.model_name = s.model
                    WHERE s.api_key != 'litellm-internal-health-check'
                      AND s.status = 'success'
                    GROUP BY 1, s.model
                )
                SELECT 
                    u.credential_alias as tag_name,
                    SUM((u.prompt_tokens / 1000000.0) * u.p1m + (u.completion_tokens / 1000000.0) * u.c1m) as total_usd,
                    MAX(t.spend_limit) as limit_usd
                FROM UsageData u
                JOIN admin_key_usage_tags t ON t.tag_name = u.credential_alias
                WHERE t.status = 'active'
                GROUP BY u.credential_alias
            `);

            const rows = result.rows;
            const archivedTags: string[] = [];

            for (const row of rows) {
                const totalSpend = parseFloat(row.total_usd) || 0;
                const limit = parseFloat(row.limit_usd) || 290;

                if (totalSpend >= limit) {
                    console.log(`[Tag Limits Cron] ALARM: Tag "${row.tag_name}" has spent $${totalSpend.toFixed(4)}, exceeding limit of $${limit.toFixed(2)}. Archiving and deleting models.`);

                    // Mark as archived
                    await client.query(`
                        UPDATE admin_key_usage_tags
                        SET status = 'archived', updated_at = CURRENT_TIMESTAMP
                        WHERE tag_name = $1
                    `, [row.tag_name]);

                    // Delete affected models from LiteLLM directly
                    const searchTag = `provider_key:${row.tag_name}`;
                    await client.query(`
                        DELETE FROM "LiteLLM_ProxyModelTable" 
                        WHERE litellm_params -> 'tags' @> $1:: jsonb
                        `, [JSON.stringify([searchTag])]);

                    archivedTags.push(row.tag_name);
                }
            }

            return NextResponse.json({
                success: true,
                message: `Checked ${rows.length} active tags. Archived ${archivedTags.length} tags over limit.`,
                archived: archivedTags
            });

        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error("Error in enforce-tag-limits cron:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
