import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const stringSession = new StringSession(process.env.TELEGRAM_SESSION || "");

let client: TelegramClient | null = null;

export async function getTelegramClient() {
    if (!apiId || !apiHash || !process.env.TELEGRAM_SESSION) {
        throw new Error("Missing Telegram configuration in .env");
    }

    if (!client) {
        client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });
        await client.connect();
    }

    // Ensure connection is alive
    if (!client.connected) {
        console.log("[Telegram] Client disconnected. Reconnecting...");
        try {
            await client.connect();
        } catch (e) {
            console.error("[Telegram] Reconnection failed, creating new client instance...", e);
            // Force recreate
            client = new TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: 5,
            });
            await client.connect();
        }
    }

    return client;
}
