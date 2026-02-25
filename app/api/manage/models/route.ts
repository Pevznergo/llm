import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { spawnGostContainer, stopGostContainer } from '../gost_manager';

export async function GET() {
    try {
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
        const body = await req.json();
        const { name, api_key, proxy_url, spend_limit, models_config } = body;

        // name: string, api_key: string, proxy_url: string(opt), spend_limit: number, models_config: Array
        if (!name || !api_key || !spend_limit || !models_config || !Array.isArray(models_config)) {
            return NextResponse.json({ error: "Missing required fields or invalid config config" }, { status: 400 });
        }

        if (models_config.length === 0) {
            return NextResponse.json({ error: "At least one model must be configured in the group" }, { status: 400 });
        }

        // 1. Insert the Group record in DB
        // Notice we store models_config as JSONB, and initialize spend_today = 0
        const result = await sql`
            INSERT INTO managed_models (name, api_key, proxy_url, spend_limit, spend_today, models_config, status)
            VALUES (${name}, ${api_key}, ${proxy_url || null}, ${spend_limit}, 0, ${JSON.stringify(models_config)}, 'queued')
            RETURNING id
        `;
        const newId = result[0].id;

        // 2. Spawn the Gost Proxy if a proxy_url was provided
        let containerName = null;
        let internalApiBase = null;
        if (proxy_url) {
            try {
                const proxyInfo = await spawnGostContainer(newId, proxy_url);
                containerName = proxyInfo.containerName;
                internalApiBase = proxyInfo.internalApiBase;
            } catch (proxyError: any) {
                // Rollback insertion if container fails to start
                await sql`DELETE FROM managed_models WHERE id = ${newId}`;
                return NextResponse.json({ error: `Failed to spawn proxy: ${proxyError.message}` }, { status: 500 });
            }
        }

        // 3. Update the record with the container info
        if (containerName) {
            await sql`
                UPDATE managed_models 
                SET gost_container_id = ${containerName}
                WHERE id = ${newId}
            `;
        }

        return NextResponse.json({
            success: true,
            id: newId,
            gost_container_id: containerName,
            internalApiBase
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
