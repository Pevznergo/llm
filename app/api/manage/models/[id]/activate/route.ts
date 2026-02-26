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

        // If the group has a SOCKS5 proxy, spawn the reverse proxy container
        let proxyApiBase: string | null = null;
        if (group.proxy_url) {
            const primaryApiBase = modelsConfig[0]?.api_base;
            if (!primaryApiBase) {
                return NextResponse.json({ error: 'First model must have api_base set for proxy routing' }, { status: 400 });
            }
            try {
                const proxyInfo = await spawnGostContainer(id, group.proxy_url, primaryApiBase);
                proxyApiBase = proxyInfo.internalApiBase;
                await sql`UPDATE managed_models SET gost_container_id = ${proxyInfo.containerName} WHERE id = ${id}`;
                console.log(`[Activate] Proxy container ready: api_base=${proxyApiBase}`);
            } catch (e: any) {
                console.error(`[Activate] Proxy spawn failed for group ${id}:`, e.message);
                return NextResponse.json({ error: `Proxy container failed: ${e.message}` }, { status: 500 });
            }
        }

        // Register each model in LiteLLM
        const registeredIds: string[] = [];
        const errors: string[] = [];

        for (const modelDef of modelsConfig) {
            try {
                const internalId = `managed_group_${id}_${modelDef.litellm_name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

                // If proxy is active, use the proxy container's api_base (HTTP)
                // Otherwise use the model's own api_base (direct HTTPS to provider)
                const effectiveApiBase = proxyApiBase || modelDef.api_base;

                const res = await axios.post(`${LITELLM_URL}/model/new`, {
                    model_name: modelDef.public_name,
                    litellm_params: {
                        model: modelDef.litellm_name,
                        api_key: modelDef.api_key,
                        api_base: effectiveApiBase,
                        input_cost_per_token: modelDef.pricing_input,
                        output_cost_per_token: modelDef.pricing_output,
                        custom_llm_provider: 'custom_openai',
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
            return NextResponse.json({ error: 'All model registrations failed', details: errors }, { status: 500 });
        }

        await sql`
            UPDATE managed_models 
            SET status = 'active', 
                litellm_model_ids = ${JSON.stringify(registeredIds)}::jsonb,
                cooldown_until = NULL,
                spend_today = 0
            WHERE id = ${id}
        `;

        await axios.post(`${LITELLM_URL}/cache/redis/flushall`, {}, {
            headers: { Authorization: `Bearer ${masterKey}` },
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            registered: registeredIds.length,
            proxyApiBase: proxyApiBase || undefined,
            errors: errors.length ? errors : undefined,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
