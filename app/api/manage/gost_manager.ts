import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Simple in-memory tracker or dynamic port assigner.
// In a real production system with multiple restarts, 
// we'd query the DB for max port in use, but this works for 4-10 models.
let currentPort = 8080;

export async function spawnGostContainer(modelId: number, proxyUrl: string): Promise<{ containerName: string, internalApiBase: string }> {
    const port = ++currentPort;
    // Create a predictable container name based on our DB's managed_models.id
    const containerName = `gost_proxy_model_${modelId}`;

    console.log(`[GostManager] Spawning container ${containerName} mapped to ${proxyUrl} on port ${port}...`);

    // Command to launch gogost/gost inside the same docker network LLM uses
    // We bind to a dynamic internal port, and forward it to the provided SOCKS5 proxy
    // We do NOT expose to 0.0.0.0 for security.
    const runCmd = `docker run -d --name ${containerName} --restart always gogost/gost -L=http://:${port} -F=${proxyUrl}`;

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
