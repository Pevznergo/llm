import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { litellm_params } = await req.json();

        const apiKey = litellm_params.api_key;
        let apiBase = litellm_params.api_base || "https://api.openai.com/v1";

        if (apiBase.endsWith("/")) apiBase = apiBase.slice(0, -1);

        // If the URL already contains chat/completions (e.g. from template), remove it or handle it.
        // Or if it just points to the base API, append it:
        const testUrl = apiBase.includes("/chat/completions") ? apiBase : `${apiBase}/chat/completions`;

        const axiosConfig: any = {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            timeout: 10000
        };

        // Note: For custom litellm integrations that use `custom_llm_provider` we just emulate a basic OpenAI payload.
        // It might fail for non-OpenAI-API compatible endpoints, but user says they use openai format templates + proxy.
        if (litellm_params.proxy_url) {
            const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;
            axiosConfig.httpsAgent = new HttpsProxyAgent(litellm_params.proxy_url);
        }

        const testBody = {
            model: litellm_params.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 5
        };

        const res = await axios.post(testUrl, testBody, axiosConfig);

        return NextResponse.json({ success: true, data: res.data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, details: e.response?.data }, { status: 400 });
    }
}
