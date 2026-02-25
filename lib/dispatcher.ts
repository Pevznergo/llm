import { getActiveManagedModels, getQueuedManagedModels, updateManagedModelStatus, updateRequestsToday } from "./managed-models-db";
import { deleteModel, createModel } from "./litellm";
import { Pool } from 'pg';
import axios from "axios";

const MAX_ACTIVE_MODELS = 4;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

let litellmPool: Pool | undefined;

const getLitellmDb = () => {
    const currentUrl = process.env.DATABASE_URL;
    if (!currentUrl) throw new Error("DATABASE_URL is not defined in environment variables for LiteLLM DB.");
    if (!litellmPool) {
        litellmPool = new Pool({ connectionString: currentUrl, ssl: { rejectUnauthorized: false } });
    }
    return litellmPool;
};

export async function runDispatcher() {
    try {
        const activeModels = await getActiveManagedModels();
        let litellmDb;
        try {
            litellmDb = await getLitellmDb().connect();
        } catch (e) {
            console.error("[Dispatcher] Could not connect to LiteLLM DB for usage check", e);
            return;
        }

        let usageRows: any[] = [];
        try {
            const usageResult = await litellmDb.query(`
                SELECT model_id, COUNT(request_id) as consumed_today
                FROM "LiteLLM_SpendLogs"
                WHERE status = 'success'
                  AND api_key != 'litellm-internal-health-check'
                  AND DATE("startTime" AT TIME ZONE 'America/Los_Angeles') >= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')
                GROUP BY model_id
            `);
            usageRows = usageResult.rows;
        } finally {
            litellmDb.release();
        }

        const usageMap = new Map<string, number>();
        for (const r of usageRows) {
            usageMap.set(r.model_id, parseInt(r.consumed_today) || 0);
        }

        // 1. Check active models for limits
        let exhaustedCount = 0;
        for (const model of activeModels) {
            const litellmModelId = model.model_info?.id || model.model_name;
            const consumed = usageMap.get(litellmModelId) || 0;

            await updateRequestsToday(model.id, consumed);

            if (consumed >= model.daily_request_limit) {
                console.log(`[Dispatcher] Model ${model.model_name} (ID: ${model.id}) reached daily limit (${consumed}/${model.daily_request_limit}). Deactivating...`);
                try {
                    // Try to delete from litellm (ignoring 404s if it was already deleted)
                    await deleteModel(litellmModelId);
                } catch (e) {
                    console.warn(`[Dispatcher] Failed to delete model ${litellmModelId} from LiteLLM. Continuing...`);
                }
                await updateManagedModelStatus(model.id, 'exhausted');
                exhaustedCount++;
            }
        }

        // 2. Replenish active models if needed
        const currentActiveModels = await getActiveManagedModels();
        let needed = MAX_ACTIVE_MODELS - currentActiveModels.length;

        if (needed > 0) {
            const queuedModels = await getQueuedManagedModels();
            for (let i = 0; i < needed && i < queuedModels.length; i++) {
                const nextModel = queuedModels[i];
                console.log(`[Dispatcher] Activating queued model ${nextModel.model_name} (ID: ${nextModel.id})`);
                try {
                    const newConfig = {
                        model_name: nextModel.model_name,
                        litellm_params: nextModel.litellm_params,
                        model_info: nextModel.model_info
                    };
                    await createModel(newConfig);
                    await updateManagedModelStatus(nextModel.id, 'active');
                } catch (e) {
                    console.error(`[Dispatcher] Failed to activate model ${nextModel.model_name}`, e);
                }
            }
        }

        // 3. Check threshold for Slack Alert
        const finalActive = await getActiveManagedModels();
        const finalQueued = await getQueuedManagedModels();
        const totalRemaining = finalActive.length + finalQueued.length;

        if (totalRemaining <= 3 && SLACK_WEBHOOK_URL) {
            try {
                const text = `🚨 *ВНИМАНИЕ: Очередь моделей пустеет!* 🚨\nОсталось всего моделей в ротации: *${totalRemaining}* (Активно: ${finalActive.length}, В очереди: ${finalQueued.length}).\nПожалуйста, добавьте новые модели через админку.`;
                await axios.post(SLACK_WEBHOOK_URL, { text });
            } catch (e) {
                console.error("[Dispatcher] Failed to send Slack alert", e);
            }
        }
    } catch (e) {
        console.error("[Dispatcher] Master interval error:", e);
    }
}
