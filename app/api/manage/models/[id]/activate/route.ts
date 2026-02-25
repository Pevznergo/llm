import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import axios from 'axios';
import { spawnGostContainer } from '../../../gost_manager';

const LITELLM_URL = 'http://127.0.0.1:4000';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const rows = await sql`SELECT * FROM managed_models WHERE id = ${id}`;
        if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const group = rows[0];

        if (group.status === 'active') {
            return NextResponse.json({ error: 'Group is already active' }, { status: 400 });
        }

        const masterKey = process.env.LITELLM_MASTER_KEY;
        const modelsConfig: any[] = group.models_config || [];

        if (!modelsConfig.length) {
            return NextResponse.json({ error: 'No models configured in this group' }, { status: 400 });
        }

        // Register each model in LiteLLM
        const registeredIds: string[] = [];
        const errors: string[] = [];

        for (const modelDef of modelsConfig) {
            try {
                // Determine the effective api_base for this model
                // If group has a proxy_url, spawn a Gost container per model group (shared container)
                // Gost: TCP relay → target API through SOCKS5
                let effectiveApiBase = modelDef.api_base;

                if (group.proxy_url) {
                    let gostContainerId = group.gost_container_id;
                    let gostApiBase: string | undefined;

                    if (!gostContainerId) {
                        try {
                            // Pass the first model's api_base as the TCP relay target
                            const primaryApiBase = modelsConfig[0]?.api_base;
                            const proxyInfo = await spawnGostContainer(id, group.proxy_url, primaryApiBase);
                            gostContainerId = proxyInfo.containerName;
                            gostApiBase = proxyInfo.internalApiBase;
                            await sql`UPDATE managed_models SET gost_container_id = ${gostContainerId} WHERE id = ${id}`;
                            console.log(`[Activate] Spawned Gost: ${gostContainerId}, api_base=${gostApiBase}`);
                        } catch (e: any) {
                            console.warn(`[Activate] Could not spawn Gost for group ${id}:`, e.message);
                            // Continue without proxy
                        }
                    } else {
                        // Reconstruct from existing container
                        // Gost TCP relay: api_base = https://containerName:port (passes TLS through)
                        const port = 8090 + id;
                        // Check if primary api_base is HTTPS to determine scheme
                        const primaryApiBase = modelsConfig[0]?.api_base || '';
                        gostApiBase = primaryApiBase.startsWith('https')
                            ? `https://${gostContainerId}:${port}`
                            : `http://${gostContainerId}:${port}`;
                    }

                    // LiteLLM points to Gost; Gost relays through SOCKS5 to real API
                    if (gostApiBase) {
                        // Preserve the URL path from the original api_base
                        try {
                            const originalUrl = new URL(modelDef.api_base);
                            effectiveApiBase = `${gostApiBase}${originalUrl.pathname}`;
                        } catch {
                            effectiveApiBase = gostApiBase;
                        }
                    }
                }

                const internalId = `managed_group_${id}_${modelDef.litellm_name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

                const res = await axios.post(`${LITELLM_URL}/model/new`, {
                    model_name: modelDef.public_name,
                    litellm_params: {
                        model: modelDef.litellm_name,
                        api_key: modelDef.api_key,
                        api_base: effectiveApiBase,
                        input_cost_per_token: modelDef.pricing_input,
                        output_cost_per_token: modelDef.pricing_output,
                        custom_llm_provider: 'openai',
                    },
                    model_info: { id: internalId, base_model: modelDef.public_name },
                }, {
                    headers: { Authorization: `Bearer ${masterKey}` },
                });

                const litellmId = res.data?.data?.model_info?.id || internalId;
                registeredIds.push(litellmId);
                console.log(`[Activate] Registered ${modelDef.public_name} → api_base=${effectiveApiBase}`);
            } catch (e: any) {
                const msg = `Failed to register ${modelDef.public_name}: ${e.response?.data?.error?.message || e.message}`;
                errors.push(msg);
                console.error(`[Activate] ${msg}`);
            }
        }

        if (!registeredIds.length) {
            return NextResponse.json({
                error: 'All model registrations failed',
                details: errors,
            }, { status: 500 });
        }

        await sql`
            UPDATE managed_models 
            SET status = 'active', 
                litellm_model_ids = ${JSON.stringify(registeredIds)}::jsonb,
                cooldown_until = NULL,
                spend_today = 0
            WHERE id = ${id}
        `;

        // Flush LiteLLM router cache
        await axios.post(`${LITELLM_URL}/cache/redis/flushall`, {}, {
            headers: { Authorization: `Bearer ${masterKey}` },
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            registered: registeredIds.length,
            errors: errors.length ? errors : undefined,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
