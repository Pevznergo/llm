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

/** Deterministic port per model group: 8090 + modelId (base 8090 to avoid common port conflicts) */
const gostPort = (modelId: number) => 8090 + modelId;

export async function spawnGostContainer(modelId: number, proxyUrl: string): Promise<{ containerName: string, internalApiBase: string }> {
    const port = gostPort(modelId);
    const containerName = `gost_proxy_model_${modelId}`;
    const normalizedProxy = normalizeProxyUrl(proxyUrl);

    console.log(`[GostManager] Spawning container ${containerName} mapped to ${normalizedProxy} on port ${port}...`);

    const runCmd = `docker run -d --name ${containerName} --restart always gogost/gost -L=http://:${port} -F=${normalizedProxy}`;

    try {
        const { stdout, stderr } = await execAsync(runCmd);
        if (stderr && !stderr.includes('WARNING')) {
            console.warn(`[GostManager] Docker Stderr: ${stderr}`);
        }

        console.log(`[GostManager] Spawning successful. Container hash: ${stdout.trim()}`);

        // The API base LiteLLM needs to target this specific proxy
        // Because they share the docker network, LiteLLM can resolve the containerName
        // But since Next.js might be outside the network, the API base depends on architecture.
        // Easiest is using host.docker.internal or explicit IP if NextJS is bare-metal.
        // Assuming LiteLLM resolves this container correctly:
        const internalApiBase = `http://${containerName}:${port}/v1`;

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
