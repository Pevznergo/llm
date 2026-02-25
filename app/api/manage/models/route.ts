import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { spawnGostContainer, stopGostContainer } from '@/lib/gost_manager';

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
        const { name, api_key, proxy_url, daily_request_limit } = body;

        if (!name || !api_key || !daily_request_limit) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. First, insert the record in DB to get a unique ID for the container name
        const result = await sql`
            INSERT INTO managed_models (name, api_key, proxy_url, daily_request_limit, status)
            VALUES (${name}, ${api_key}, ${proxy_url || null}, ${daily_request_limit}, 'queued')
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
