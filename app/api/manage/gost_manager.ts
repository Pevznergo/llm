import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/** Docker image name for the reverse proxy */
const PROXY_IMAGE = 'socks-reverse-proxy';

/**
 * Normalize proxy URL format.
 * Accepts both standard `socks5h://user:pass@ip:port`
 * and shorthand `socks5h://ip:port:user:pass` (ip:port:login:password).
 */
function normalizeProxyUrl(rawUrl: string): string {
    const shorthand = rawUrl.match(/^(socks5h?|http|https):\/\/([^:]+):(\d+):([^:]+):(.+)$/);
    if (shorthand) {
        const [, scheme, host, port, user, pass] = shorthand;
        return `${scheme}://${user}:${pass}@${host}:${port}`;
    }
    return rawUrl;
}

/** Deterministic port per model group: 8090 + modelId */
const proxyPort = (modelId: number) => 8090 + modelId;

/**
 * Ensure the socks-reverse-proxy Docker image is built.
 * Idempotent — skips if image already exists.
 */
async function ensureImage(): Promise<void> {
    try {
        const { stdout } = await execAsync(`docker images -q ${PROXY_IMAGE}`);
        if (stdout.trim()) return; // already built
    } catch { /* continue to build */ }

    console.log('[ProxyManager] Building socks-reverse-proxy Docker image...');
    await execAsync(`docker build -t ${PROXY_IMAGE} /root/litellm/socks-reverse-proxy`);
    console.log('[ProxyManager] Image built successfully.');
}

/**
 * Spawn a reverse proxy container.
 *
 * Flow:  LiteLLM ──HTTP──▶ container:PORT ──HTTPS via SOCKS5H──▶ real API
 *
 * @param modelId      - Group ID (determines container name & port)
 * @param socksProxy   - SOCKS5H URL, e.g. socks5h://user:pass@ip:port or shorthand
 * @param targetApiBase - Real upstream URL, e.g. https://generativelanguage.googleapis.com
 * @returns containerName and the HTTP api_base LiteLLM should use
 */
export async function spawnGostContainer(
    modelId: number,
    socksProxy: string,
    targetApiBase: string
): Promise<{ containerName: string, internalApiBase: string, externalApiBase: string }> {
    await ensureImage();

    const port = proxyPort(modelId);
    const containerName = `socks_proxy_model_${modelId}`;
    const normalizedProxy = normalizeProxyUrl(socksProxy);

    // Extract the origin (scheme + host) from the target for the reverse proxy
    const targetUrl = new URL(targetApiBase);
    const targetOrigin = targetUrl.origin; // e.g. https://generativelanguage.googleapis.com

    console.log(`[ProxyManager] Spawning ${containerName} port=${port} target=${targetOrigin} via SOCKS5H`);

    // Remove old container if it exists (idempotent)
    await execAsync(`docker rm -f ${containerName}`).catch(() => { });

    const runCmd = [
        'docker run -d',
        `--name ${containerName}`,
        '--network litellm_default',
        `--publish ${port}:${port}`,
        '--restart always',
        `-e PORT=${port}`,
        `-e TARGET_URL=${targetOrigin}`,
        `-e SOCKS_PROXY=${normalizedProxy}`,
        PROXY_IMAGE,
    ].join(' ');

    try {
        const { stdout, stderr } = await execAsync(runCmd);
        if (stderr && !stderr.includes('WARNING')) {
            console.warn(`[ProxyManager] Docker Stderr: ${stderr}`);
        }
        console.log(`[ProxyManager] Spawned ${containerName}: ${stdout.trim()}`);

        // Internal: for LiteLLM (inside Docker) — uses container name
        const internalApiBase = `http://${containerName}:${port}${targetUrl.pathname}`;
        // External: for Next.js test route (on host) — uses localhost
        const externalApiBase = `http://127.0.0.1:${port}${targetUrl.pathname}`;

        return { containerName, internalApiBase, externalApiBase };
    } catch (e: any) {
        throw new Error(`Failed to spawn proxy: ${e.message}`);
    }
}

export async function stopGostContainer(containerName: string): Promise<void> {
    console.log(`[ProxyManager] Killing and removing container ${containerName}...`);
    try {
        await execAsync(`docker rm -f ${containerName}`);
        console.log(`[ProxyManager] Removed ${containerName}`);
    } catch (e: any) {
        if (!e.message.includes('No such container')) {
            throw new Error(`Failed to kill proxy: ${e.message}`);
        }
    }
}
