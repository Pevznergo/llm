import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { spawnGostContainer } from '../gost_manager';

/** 
 * Create table + run schema migrations inline.
 * All statements are idempotent — safe to call on every request.
 */
async function ensureMigrations() {
    // Create table if it has never been initialised (cold start / no server restart)
    await sql`
        CREATE TABLE IF NOT EXISTS managed_models (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            api_key VARCHAR(255),
            proxy_url VARCHAR(255),
            gost_container_id VARCHAR(255),
            litellm_model_id VARCHAR(255),
            daily_request_limit INTEGER,
            requests_today INTEGER DEFAULT 0,
            spend_limit DECIMAL(10, 4) DEFAULT 300,
            spend_today DECIMAL(10, 4) DEFAULT 0,
            models_config JSONB DEFAULT '[]'::jsonb,
            litellm_model_ids JSONB DEFAULT '[]'::jsonb,
            cooldown_until TIMESTAMP,
            status VARCHAR(50) DEFAULT 'queued',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    // Idempotent column additions for existing tables
    await sql`ALTER TABLE managed_models ADD COLUMN IF NOT EXISTS spend_limit DECIMAL(10, 4) DEFAULT 300`;
    await sql`ALTER TABLE managed_models ADD COLUMN IF NOT EXISTS spend_today DECIMAL(10, 4) DEFAULT 0`;
    await sql`ALTER TABLE managed_models ADD COLUMN IF NOT EXISTS models_config JSONB DEFAULT '[]'::jsonb`;
    await sql`ALTER TABLE managed_models ADD COLUMN IF NOT EXISTS litellm_model_ids JSONB DEFAULT '[]'::jsonb`;
    await sql`ALTER TABLE managed_models ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMP`;
    try { await sql`ALTER TABLE managed_models ALTER COLUMN api_key DROP NOT NULL`; } catch { }
    try { await sql`ALTER TABLE managed_models ALTER COLUMN daily_request_limit DROP NOT NULL`; } catch { }
}

export async function GET() {
    try {
        await ensureMigrations();
        const models = await sql`
            SELECT * FROM managed_models 
            ORDER BY 
                CASE status 
                    WHEN 'active' THEN 1 
                    WHEN 'queued' THEN 2 
                    WHEN 'exhausted' THEN 3 
                    ELSE 4 
                END, 
            created_at ASC
        `;
        return NextResponse.json({ models });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureMigrations();

        const body = await req.json();
        const { name, proxy_url, spend_limit, models_config } = body;

        // Each model in models_config has its own api_key
        if (!name || !spend_limit || !models_config || !Array.isArray(models_config)) {
            return NextResponse.json({ error: "Missing required fields or invalid models_config" }, { status: 400 });
        }

        if (models_config.length === 0) {
            return NextResponse.json({ error: "At least one model must be configured in the group" }, { status: 400 });
        }

        if (models_config.some((m: any) => !m.api_key || !m.litellm_name || !m.public_name)) {
            return NextResponse.json({ error: "Each model must have api_key, litellm_name and public_name" }, { status: 400 });
        }

        // Insert the Group record (no group-level api_key — it's per-model inside models_config)
        const result = await sql`
            INSERT INTO managed_models (name, proxy_url, spend_limit, spend_today, models_config, status)
            VALUES (${name}, ${proxy_url || null}, ${spend_limit}, 0, ${JSON.stringify(models_config)}, 'queued')
            RETURNING id
        `;
        const newId = result[0].id;

        // Proxy container is spawned when user clicks Activate (not at insert time)
        // This avoids needing to know the api_base at queue time

        return NextResponse.json({
            success: true,
            id: newId,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
