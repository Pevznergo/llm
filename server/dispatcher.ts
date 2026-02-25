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
            // Simulated check: if requests_today >= daily_request_limit
            if (model.requests_today >= model.daily_request_limit) {
                console.log(`[Dispatcher] Model ${model.id} exhausted limits. Archiving.`);

                // Remove from LiteLLM router
                if (model.litellm_model_id) {
                    await axios.post(`${LITELLM_URL}/model/delete`, { id: model.litellm_model_id }, {
                        headers: { 'Authorization': `Bearer ${MASTER_KEY}` }
                    }).catch(e => console.warn(`[Dispatcher] LiteLLM delete failed for ${model.id}`));
                }

                // Kill Gost Container to free RAM
                if (model.gost_container_id) {
                    await stopGostContainer(model.gost_container_id).catch(() => { });
                }

                // Update DB Status
                await sql`UPDATE managed_models SET status = 'exhausted' WHERE id = ${model.id}`;
                modelsRemoved++;
            }
        }

        // 3. Replenish Active Models if bellow max capacity (4)
        const currentActiveCount = activeModels.length - modelsRemoved;
        const slotsAvailable = Math.max(0, 4 - currentActiveCount);

        for (let i = 0; i < slotsAvailable && i < queuedModels.length; i++) {
            const nextModel = queuedModels[i];
            console.log(`[Dispatcher] Promoting queued model ${nextModel.id} to active.`);

            // Register in LiteLLM
            // Our proxy translation is either native (null gost_id) or points to the Gost container
            const apiBase = nextModel.gost_container_id
                ? `http://${nextModel.gost_container_id}:${8080 + nextModel.id}/v1`
                : undefined;

            try {
                const addRes = await axios.post(`${LITELLM_URL}/model/new`, {
                    model_name: nextModel.name,
                    litellm_params: {
                        model: 'openai/gemini-2.5-pro', // Or dynamically mapped
                        api_key: nextModel.api_key,
                        api_base: apiBase,
                    },
                    model_info: { id: `managed_${nextModel.id}`, base_model: nextModel.name }
                }, {
                    headers: { 'Authorization': `Bearer ${MASTER_KEY}` }
                });

                const litellmId = addRes.data.data.model_info.id;

                await sql`
                    UPDATE managed_models 
                    SET status = 'active', litellm_model_id = ${litellmId} 
                    WHERE id = ${nextModel.id}
                `;
            } catch (e: any) {
                console.error(`[Dispatcher] Failed to add model ${nextModel.id} to LiteLLM router: ${e.message}`);
            }
        }

        // 4. Alerting Checks
        const remainingQueue = queuedModels.length - slotsAvailable;
        const totalAlive = currentActiveCount + Math.max(0, remainingQueue);

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
