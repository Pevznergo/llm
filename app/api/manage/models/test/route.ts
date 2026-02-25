import { NextResponse } from 'next/server';
import { spawnGostContainer, stopGostContainer } from '../../gost_manager';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { api_key, proxy_url } = body;

        if (!api_key || !proxy_url) {
            return NextResponse.json({ error: "Missing api_key or proxy_url" }, { status: 400 });
        }

        // 1. Spawn a temporary Gost container just for testing
        // We use a high random ID to avoid collisions with real DB models
        const tempId = Math.floor(Math.random() * 1000000) + 90000;
        let proxyInfo;
        try {
            proxyInfo = await spawnGostContainer(tempId, proxy_url);
        } catch (e: any) {
            return NextResponse.json({ error: `Failed to spawn test proxy: ${e.message}` }, { status: 500 });
        }

        const { containerName, internalApiBase } = proxyInfo;

        // 2. Perform a test request to Gemini/OpenAI through our new Gost proxy
        // Since LiteLLM isn't involved here, we literally hit the real OpenAI mapping
        // However, because we are testing Gemini via OpenAI SDK format (or similar),
        // we will hit the standard OpenAI endpoints. If they use Google directly, this is trickier.
        // Assuming they hit proxy_base + /chat/completions (OpenAI compat)
        // Wait 1 second for Gost to fully bind port
        await new Promise(r => setTimeout(r, 1000));

        let testSuccess = false;
        let testError = "";

        try {
            // Because the frontend Next.js server might not be able to resolve docker network DNS names
            // if it runs loosely outside of Docker, we route the test via localhost if the port is published.
            // But our Gost spawner binds to :PORT which exposes it to host.
            // Note: internalApiBase contains the docker DNS name (e.g. gost_proxy_123:8080).
            // Let's parse out the port to test via localhost directly from the host machine:
            const mappedPort = internalApiBase.match(/:(\d+)/)?.[1];

            // Try fetching models endpoint as a lightweight test
            const res = await axios.get(`http://127.0.0.1:${mappedPort}/v1/models`, {
                headers: { 'Authorization': `Bearer ${api_key}` },
                timeout: 5000
            });
            testSuccess = res.status === 200;
        } catch (e: any) {
            testError = e.response?.data?.error?.message || e.message;
        }

        // 3. Clean up the temp container regardless of success/fail
        await stopGostContainer(containerName);

        if (testSuccess) {
            return NextResponse.json({ success: true, message: "Connection successful!" });
        } else {
            return NextResponse.json({ error: `Connection failed: ${testError}` }, { status: 502 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
