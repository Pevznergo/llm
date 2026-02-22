import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();

    const connectedMap = new Map<string, number>();
    try {
        const modelResult = await client.query(`SELECT model_name, litellm_params FROM "LiteLLM_ProxyModelTable"`);
        console.log("Found", modelResult.rows.length, "models in DB.");
        for (let i = 0; i < Math.min(3, modelResult.rows.length); i++) {
            const row = modelResult.rows[i];
            const p = row.litellm_params;
            const mName = row.model_name;
            let paramsObj = typeof p === 'string' ? JSON.parse(p) : p;
            console.log(`Params for ${mName}:`, paramsObj);
        }
    } finally {
        client.release();
        await pool.end();
    }
}
test().catch(console.error);
