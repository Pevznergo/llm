import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000";
    const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || process.env.APORTO_API_KEY || "";

    const url = `${LITELLM_BASE_URL}/model/info`;
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LITELLM_MASTER_KEY}`,
        },
    });

    if (!res.ok) {
        console.error("LiteLLM API Error:", await res.text());
        return;
    }
    const data = await res.json();
    const detailedData = data.data || data;

    console.log("Got models:", detailedData.length);
    for (let i = 0; i < Math.min(3, detailedData.length); i++) {
        const m = detailedData[i];
        console.log(`Model name: ${m.model_name}`);
        console.log(`litellm_params:`, m.litellm_params);
        console.log(`model_info:`, m.model_info);
    }
}
test().catch(console.error);
