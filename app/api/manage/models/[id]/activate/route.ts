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

        // Spawn Gost proxy if proxy_url is set but container not yet created
        let gostContainerId = group.gost_container_id;
        let apiBase: string | undefined = undefined;

        if (group.proxy_url && !gostContainerId) {
            try {
                const proxyInfo = await spawnGostContainer(id, group.proxy_url);
                gostContainerId = proxyInfo.containerName;
                apiBase = proxyInfo.internalApiBase;
                await sql`UPDATE managed_models SET gost_container_id = ${gostContainerId} WHERE id = ${id}`;
            } catch (e: any) {
                console.warn(`[Activate] Could not spawn Gost for group ${id}:`, e.message);
                // Continue without proxy — models can still be registered directly
            }
        } else if (gostContainerId) {
            apiBase = `http://${gostContainerId}:${8080 + id}/v1`;
        }

        // Register each model in LiteLLM
        const registeredIds: string[] = [];
        const errors: string[] = [];

        for (const modelDef of modelsConfig) {
            try {
                const internalId = `managed_group_${id}_${modelDef.litellm_name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

                const res = await axios.post(`${LITELLM_URL}/model/new`, {
                    model_name: modelDef.public_name,
                    litellm_params: {
                        model: modelDef.litellm_name,
                        api_key: modelDef.api_key,
                        api_base: modelDef.api_base || apiBase,
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
                console.log(`[Activate] Registered model ${modelDef.public_name} → LiteLLM ID ${litellmId}`);
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

        // Mark group as active, save litellm IDs
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
