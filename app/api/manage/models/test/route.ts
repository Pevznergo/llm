import { NextResponse } from 'next/server';
import { spawnGostContainer, stopGostContainer } from '../../gost_manager';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { api_key, proxy_url, api_base, litellm_name } = body;

        if (!api_key) {
            return NextResponse.json({ error: "Missing api_key" }, { status: 400 });
        }

        // If no proxy — test the API directly
        const targetBase = api_base || 'https://generativelanguage.googleapis.com/v1beta/openai/';
        let testBase = targetBase;
        let containerName: string | null = null;

        if (proxy_url) {
            // Spawn a temporary reverse proxy container
            // Keep tempId small so port (8090+tempId) stays under 65535
            const tempId = Math.floor(Math.random() * 500) + 50000;
            try {
                const proxyInfo = await spawnGostContainer(tempId, proxy_url, targetBase);
                containerName = proxyInfo.containerName;
                testBase = proxyInfo.externalApiBase; // localhost:PORT — reachable from host
            } catch (e: any) {
                return NextResponse.json({ error: `Failed to spawn test proxy: ${e.message}` }, { status: 500 });
            }

            // Wait for the container to start
            await new Promise(r => setTimeout(r, 2000));
        }

        let testSuccess = false;
        let testError = "";
        let responseSnippet = "";

        try {
            // Normalize base URL for chat completions
            const base = testBase.replace(/\/+$/, '');
            const url = `${base}/chat/completions`;

            const model = litellm_name || 'gemini-2.5-flash';

            console.log(`[Test] POST ${url} model=${model} proxy=${!!proxy_url}`);

            const res = await axios.post(url, {
                model,
                messages: [{ role: 'user', content: 'Hi, reply with just the word PONG' }],
                max_tokens: 10,
            }, {
                headers: {
                    'Authorization': `Bearer ${api_key}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            });

            testSuccess = res.status === 200;
            const content = res.data?.choices?.[0]?.message?.content || '';
            responseSnippet = content.substring(0, 50);
        } catch (e: any) {
            testError = e.response?.data?.error?.message || e.message;
        }

        // Clean up temp container
        if (containerName) {
            await stopGostContainer(containerName);
        }

        if (testSuccess) {
            return NextResponse.json({
                success: true,
                message: `✅ Connection OK! Response: "${responseSnippet}"`,
            });
        } else {
            return NextResponse.json({ error: `Connection failed: ${testError}` }, { status: 502 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
