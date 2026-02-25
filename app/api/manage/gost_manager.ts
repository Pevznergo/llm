import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Normalize proxy URL format.
 * Accepts both standard `socks5h://user:pass@ip:port`
 * and shorthand `socks5h://ip:port:user:pass` (ip:port:login:password).
 */
function normalizeProxyUrl(rawUrl: string): string {
    // Match shorthand: scheme://ip:port:user:pass
    const shorthand = rawUrl.match(/^(socks5h?|http|https):\/\/([^:]+):(\d+):([^:]+):(.+)$/);
    if (shorthand) {
        const [, scheme, host, port, user, pass] = shorthand;
        return `${scheme}://${user}:${pass}@${host}:${port}`;
    }
    // Already in standard form
    return rawUrl;
}

/** Deterministic port per model group: 8090 + modelId */
const gostPort = (modelId: number) => 8090 + modelId;

/**
 * Spawn a Gost container that acts as an HTTP → SOCKS5 relay.
 * - Listens on :PORT as HTTP server
 * - Forwards all traffic through SOCKS5 to the targetApiBase host
 *
 * LiteLLM sets api_base = http://containerName:PORT
 * Gost relays HTTP requests through SOCKS5 → real API endpoint
 */
export async function spawnGostContainer(
    modelId: number,
    proxyUrl: string,
    targetApiBase?: string
): Promise<{ containerName: string, internalApiBase: string }> {
    const port = gostPort(modelId);
    const containerName = `gost_proxy_model_${modelId}`;
    const normalizedProxy = normalizeProxyUrl(proxyUrl);

    // Extract host from targetApiBase for the Gost forwarding chain
    // e.g. "https://generativelanguage.googleapis.com/v1beta/openai/" → "generativelanguage.googleapis.com:443"
    let forwardHost = '';
    if (targetApiBase) {
        try {
            const u = new URL(targetApiBase);
            const defaultPort = u.protocol === 'https:' ? '443' : '80';
            forwardHost = `${u.hostname}:${u.port || defaultPort}`;
        } catch { /* keep empty */ }
    }

    console.log(`[GostManager] Spawning ${containerName} port=${port} target=${forwardHost || 'dynamic'} via ${normalizedProxy}`);

    // Gost TCP relay: local HTTP listens on :port, forwards TCP to forwardHost through SOCKS5
    // LiteLLM api_base = https://containerName:port (Gost passes TLS through to the real server)
    const gostArgs = forwardHost
        ? `-L=tcp://:${port}/${forwardHost} -F=${normalizedProxy}`
        : `-L=http://:${port} -F=${normalizedProxy}`;

    // Join the litellm_default network so LiteLLM can reach gost by container name
    const runCmd = `docker run -d --name ${containerName} --network litellm_default --restart always gogost/gost ${gostArgs}`;

    try {
        const { stdout, stderr } = await execAsync(runCmd);
        if (stderr && !stderr.includes('WARNING')) {
            console.warn(`[GostManager] Docker Stderr: ${stderr}`);
        }
        console.log(`[GostManager] Spawned ${containerName}: ${stdout.trim()}`);

        // api_base uses HTTPS to the container — Gost relays TCP so TLS passes through to real server
        const internalApiBase = forwardHost
            ? `https://${containerName}:${port}`
            : `http://${containerName}:${port}`;

        return { containerName, internalApiBase };
    } catch (e: any) {
        throw new Error(`Failed to spawn Gost proxy: ${e.message}`);
    }
}

export async function stopGostContainer(containerName: string): Promise<void> {
    console.log(`[GostManager] Killing and removing container ${containerName}...`);
    try {
        await execAsync(`docker rm -f ${containerName}`);
        console.log(`[GostManager] Removed ${containerName}`);
    } catch (e: any) {
        // Only throw if it's not a "No such container" error
        if (!e.message.includes("No such container") && !e.message.includes("Error: No such container")) {
            throw new Error(`Failed to kill Gost proxy: ${e.message}`);
        }
    }
}
