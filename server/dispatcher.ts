import { sql } from '../lib/db';
import { stopGostContainer } from '../lib/gost_manager';
import axios from 'axios';

const LITELLM_URL = 'http://127.0.0.1:4000';
const MASTER_KEY = process.env.LITELLM_MASTER_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendSlackAlert(message: string) {
    if (!SLACK_WEBHOOK_URL) return;
    try {
        await axios.post(SLACK_WEBHOOK_URL, { text: `🚨 *Model Dispatcher Alert* \n${message}` });
    } catch (e) {
        console.error("[Dispatcher] Failed to send Slack alert", e);
    }
}

async function runDispatcherCycle() {
    console.log(`[Dispatcher] Starting cycle... ${new Date().toISOString()}`);

    try {
        // 1. Fetch all managed models
        const models = await sql`SELECT * FROM managed_models`;
        const activeModels = models.filter(m => m.status === 'active');
        const queuedModels = models.filter(m => m.status === 'queued')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // 2. Sync usage for Active Models from LiteLLM
        // We pull the /model/info to check how many requests this specific ID has done today
        // Note: LiteLLM tracks Spend/usage, we assume 'request_count' or similar if exposed.
        // For this MVP, if LiteLLM doesn't expose clean request counters per model easily,
        // we might actually track the usage inside NextJS middleware, but let's assume we can fetch it
        // Or we enforce limits purely within our DB by having LiteLLM post to a webhook.
        // Let's use LiteLLM's Spend reporting if available, or just rely on a dummy count for now.

        // In a real scenario, we check the model info from LiteLLM:
        // const info = await axios.get(`${LITELLM_URL}/model/info...`);

        let modelsRemoved = 0;

        for (const model of activeModels) {
            // Aggregate spend for all sub-models in this group
            let currentSpend = 0;
            const modelIds = model.litellm_model_ids || [];

            for (const litellmId of modelIds) {
                try {
                    // Fetch real-time spend from LiteLLM's info route
                    const res = await axios.get(`${LITELLM_URL}/model/info?id=${litellmId}`, {
                        headers: { 'Authorization': `Bearer ${MASTER_KEY}` }
                    });

                    if (res.data?.data?.spend) {
                        currentSpend += parseFloat(res.data.data.spend);
                    }
                } catch (e: any) {
                    console.warn(`[Dispatcher] Could not fetch spend for LiteLLM ID ${litellmId}: ${e.message}`);
                }
            }

            // Update today's spend in the DB
            await sql`UPDATE managed_models SET spend_today = ${currentSpend} WHERE id = ${model.id}`;

            // Check if group has exhausted the global spend limit
            if (currentSpend >= model.spend_limit) {
                console.log(`[Dispatcher] Model Group ${model.id} exhausted limits ($${currentSpend} >= $${model.spend_limit}). Sending to cooldown queue.`);

                // Remove all associated models from LiteLLM router
                for (const litellmId of modelIds) {
                    await axios.post(`${LITELLM_URL}/model/delete`, { id: litellmId }, {
                        headers: { 'Authorization': `Bearer ${MASTER_KEY}` }
                    }).catch(e => console.warn(`[Dispatcher] LiteLLM delete failed for ${litellmId}`));
                }

                // Kill Gost Container to free RAM and close proxy connection
                if (model.gost_container_id) {
                    await stopGostContainer(model.gost_container_id).catch(() => { });
                }

                // Compute cooldown_until: next 01:00 PST = 09:00 UTC
                // If it's already past 09:00 UTC today, target 09:00 UTC tomorrow
                const nowUtc = new Date();
                const cooldown = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 9, 0, 0, 0));
                if (nowUtc.getUTCHours() >= 9) {
                    cooldown.setUTCDate(cooldown.getUTCDate() + 1);
                }

                // Put back in queue (not exhausted!) with a cooldown, reset spend, clear LiteLLM IDs
                await sql`
                    UPDATE managed_models 
                    SET status = 'queued', spend_today = 0, litellm_model_ids = '[]'::jsonb,
                        gost_container_id = NULL, cooldown_until = ${cooldown.toISOString()}
                    WHERE id = ${model.id}
                `;
                modelsRemoved++;
            }
        }

        // 3. Replenish Active Models if below max capacity (4 groups)
        const currentActiveCount = activeModels.length - modelsRemoved;
        const slotsAvailable = Math.max(0, 4 - currentActiveCount);

        // Eligible queued groups: exclude those still in cooldown
        const now = new Date();
        const eligibleQueued = queuedModels.filter(m => !m.cooldown_until || new Date(m.cooldown_until) <= now);

        for (let i = 0; i < slotsAvailable && i < eligibleQueued.length; i++) {
            const nextGroup = eligibleQueued[i];
            console.log(`[Dispatcher] Promoting queued group ${nextGroup.id} to active.`);

            // Our proxy translation is either native (null gost_id) or points to the Gost container
            const apiBase = nextGroup.gost_container_id
                ? `http://${nextGroup.gost_container_id}:${8080 + nextGroup.id}/v1`
                : undefined;

            const modelsConfig = nextGroup.models_config || [];
            const registeredLitellmIds: string[] = [];

            // Register each model inside the group to LiteLLM
            for (const modelDef of modelsConfig) {
                try {
                    // Create a unique internal ID for LiteLLM router combining group ID and model name
                    const internalId = `managed_group_${nextGroup.id}_${modelDef.litellm_name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

                    const addRes = await axios.post(`${LITELLM_URL}/model/new`, {
                        model_name: modelDef.public_name,
                        litellm_params: {
                            model: modelDef.litellm_name,
                            api_key: modelDef.api_key, // per-model key
                            api_base: modelDef.api_base || apiBase,
                            input_cost_per_token: modelDef.pricing_input,
                            output_cost_per_token: modelDef.pricing_output,
                            custom_llm_provider: "custom_openai"
                        },
                        model_info: { id: internalId, base_model: modelDef.public_name }
                    }, {
                        headers: { 'Authorization': `Bearer ${MASTER_KEY}` }
                    });

                    registeredLitellmIds.push(addRes.data.data.model_info.id);
                } catch (e: any) {
                    console.error(`[Dispatcher] Failed to add sub-model ${modelDef.public_name} to LiteLLM router: ${e.message}`);
                }
            }

            // Update group status to active and save the IDs
            await sql`
                UPDATE managed_models 
                SET status = 'active', litellm_model_ids = ${JSON.stringify(registeredLitellmIds)}::jsonb
                WHERE id = ${nextGroup.id}
            `;
        }

        // 4. Alerting Checks — count eligible queued (not on cooldown)
        const remainingEligible = eligibleQueued.length - Math.min(slotsAvailable, eligibleQueued.length);
        const totalAlive = currentActiveCount + Math.max(0, remainingEligible);

        if (totalAlive <= 3) {
            console.warn(`[Dispatcher] WARNING: Only ${totalAlive} active/queued models left!`);
            await sendSlackAlert(`Critical: Only ${totalAlive} fresh proxy nodes remaining in the queue! We need new API keys/proxies loaded immediately.`);
        }

    } catch (e: any) {
        console.error(`[Dispatcher] Fatal Error in loop: ${e.message}`);
    }
}

// Run loop every 60 seconds
setInterval(runDispatcherCycle, 60000);
console.log("[Dispatcher] Node worker started successfully");
runDispatcherCycle(); // Run immediately once
