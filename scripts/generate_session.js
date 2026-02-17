const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

// For security, you should provide these via environment variables or manual input
// but for the script we'll ask for them if not provided.
const apiId = process.env.TELEGRAM_API_ID || "";
const apiHash = process.env.TELEGRAM_API_HASH || "";

async function generate() {
    console.log("--- Telegram Session Generator ---");

    let id = apiId;
    let hash = apiHash;

    if (!id) id = parseInt(await input.text("Please enter your API ID (from my.telegram.org): "));
    if (!hash) hash = await input.text("Please enter your API HASH: ");

    const stringSession = new StringSession(""); // blank for new session

    const client = new TelegramClient(stringSession, id, hash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Please enter your number (with country code): "),
        password: async () => await input.text("Please enter your password (if any): "),
        phoneCode: async () => await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });

    console.log("\n--- SUCCESS! ---");
    console.log("Your StringSession is below. Copy it carefully to your .env file as TELEGRAM_SESSION:\n");
    console.log(stringSession.save());
    console.log("\n----------------\n");

    await client.disconnect();
    process.exit(0);
}

generate();
