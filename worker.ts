import * as dotenv from 'dotenv';
// Load environment variables (try .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

import { sql, initDatabase, getFloodWait, setFloodWait } from './lib/db';
import { createEcosystem, setTopicClosed, getChatEntity, pinTelegramTopic, ensureBotAdminRights } from './lib/chat';
import { getTelegramClient } from './lib/tg';
import { Bot, InlineKeyboard } from 'grammy';
import { Api } from 'telegram';

// Log with timestamp
const log = (msg: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

const errorLog = (msg: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, ...args);
};

async function processUnifiedQueue() {
    // 1. Fetch oldest pending task
    const tasks = await sql`
        SELECT id, type, payload, scheduled_at 
        FROM unified_queue
        WHERE status = 'pending'
        ORDER BY scheduled_at ASC 
        LIMIT 1
    `;

    if (tasks.length === 0) return false;

    const task = tasks[0];
    const now = new Date();
    const scheduledTime = new Date(task.scheduled_at);

    // Check scheduling (if future, skip for now. Note: In a real job queue we'd select WHERE scheduled_at <= NOW(),
    // but here we wait on the head of the queue to preserve strict order if needed, OR we can modify the query.
    // Let's modify the query to skip future tasks in the next iteration, but for now strict order might be better to prevent skipping?)
    // Actually, user wants "smart scheduling", so we should simply return false if the specific task is not ready.
    // However, if task 1 is in 10 mins and task 2 is now, we should process task 2.
    // So let's refine the query in valid implementation:
    // SELECT ... WHERE status='pending' AND scheduled_at <= NOW() ORDER BY scheduled_at ASC LIMIT 1
    // But to keep simple loop:
    if (scheduledTime > now) {
        return false;
    }

    log(`Processing Task #${task.id} [${task.type}]`);

    try {
        await sql`UPDATE unified_queue SET status = 'processing' WHERE id = ${task.id}`;

        const payload = task.payload;

        // --- DISPATCHER ---
        if (task.type === 'create_chat') {
            const { title, district } = payload;

            // Check duplicates
            const alreadyExists = await sql`SELECT id FROM short_links WHERE reviewer_name = ${title}`;
            if (alreadyExists.length > 0) {
                throw new Error("Already exists in short_links");
            }

            const result = await createEcosystem(title, district);
            log(`Created Chat: ${result.chatId}`);

        } else if (task.type === 'create_promo') {
            const { chat_id, title } = payload;
            if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("Bot token missing");

            const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
            // Ensure targetChatId has -100 prefix
            const targetChatId = chat_id.toString().startsWith("-") ? chat_id.toString() : "-100" + chat_id;

            // Wait for rights propagation
            await new Promise(r => setTimeout(r, 2000));

            // Ensure Bot has Admin Rights (Manage Topics)
            try {
                await ensureBotAdminRights(chat_id.toString(), 'aportomessage_bot');
            } catch (e) {
                console.error("Failed to ensure bot rights:", e);
            }

            const topic = await bot.api.createForumTopic(targetChatId, title);
            const appLink = "https://t.me/aportomessage_bot/app?startapp=promo";
            const keyboard = new InlineKeyboard().url("🎡 КРУТИТЬ КОЛЕСО", appLink);

            const message = await bot.api.sendMessage(targetChatId, "🎰 **КОЛЕСО ФОРТУНЫ**\n\nНажми на кнопку ниже, чтобы испытать удачу и выиграть призы (iPhone, Ozon, WB).", {
                message_thread_id: topic.message_thread_id,
                reply_markup: keyboard,
                parse_mode: "Markdown",
            });

            // Track creation in topic_actions_queue if needed (optional)

            try {
                // Pin the Message (Button)
                await bot.api.pinChatMessage(targetChatId, message.message_id);
                // Close the Topic (Read Only for users)
                await bot.api.closeForumTopic(targetChatId, topic.message_thread_id);
                // Pin the Topic (Top of list)
                await pinTelegramTopic(chat_id.toString(), topic.message_thread_id, true);
            } catch (e) {
                console.error("Failed to pin/close promo:", e);
            }

            // NEW: Block Services topic as well just in case
            // Actually the user asked for "Ban on messages in Wheel of Fortune and Services ... AFTER creation"
            // Our generic blockMarketingTopics does exactly that.
            // But specifically for 'create_promo', we usually just create the promo.
            // Let's leave it focused.

            console.log(`Created promo topic ${topic.message_thread_id}`);

        } else if (task.type === 'block_topics') {
            const { chat_id } = payload;
            const { blockMarketingTopics } = require('./lib/chat');
            await blockMarketingTopics(chat_id.toString());
            console.log(`Blocked marketing topics for ${chat_id}`);
        } else if (task.type === 'clean_system_messages') {
            const { chat_id } = payload;
            const { cleanSystemMessages } = require('./lib/chat');
            await cleanSystemMessages(chat_id.toString());
            console.log(`Cleaned system messages for ${chat_id}`);

        } else if (task.type === 'update_chat_permissions') {
            const { chat_id } = payload;
            if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("Bot token missing");
            const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
            const targetChatId = chat_id.toString().startsWith("-") ? chat_id.toString() : "-100" + chat_id;

            // Ensure Bot is Admin first (via Userbot)
            try {
                const { ensureBotAdminRights } = require('./lib/chat');
                await ensureBotAdminRights(chat_id.toString(), 'aportomessage_bot');
                console.log(`Ensured admin rights for bot in ${chat_id}`);
            } catch (e: any) {
                console.warn(`Failed to promote bot in ${chat_id}: ${e.message}`);
                // Proceed anyway, maybe it's already admin
            }

            // Permissions: All ON except Pin, Topics, Info
            await bot.api.setChatPermissions(targetChatId, {
                can_send_messages: true,
                can_send_audios: true,
                can_send_documents: true,
                can_send_photos: true,
                can_send_videos: true,
                can_send_video_notes: true,
                can_send_voice_notes: true,
                can_send_polls: true,
                can_send_other_messages: true,
                can_add_web_page_previews: true,
                can_invite_users: true,

                // RESTRICTED:
                can_change_info: false,
                can_pin_messages: false,
                can_manage_topics: false
            });
            console.log(`Updated permissions for ${chat_id}`);

        } else if (task.type === 'send_message' || task.type === 'create_poll' || task.type === 'close' || task.type === 'open'
            || task.type === 'update_title' || task.type === 'rename_topic') {
            // Re-use legacy logic adapted for unified payload
            const client = await getTelegramClient();
            if (!client) throw new Error("No TG Client");

            const { chat_id } = payload;
            const entity = await getChatEntity(client, chat_id);

            let topicId = payload.topicId;
            if (!topicId && payload.topicName) {
                const forumTopics = await client.invoke(new Api.channels.GetForumTopics({
                    channel: entity,
                    limit: 100
                })) as any;
                const topic = forumTopics.topics.find((t: any) => t.title === payload.topicName);
                if (!topic) throw new Error(`Topic '${payload.topicName}' not found`);
                topicId = topic.id;
            }

            if (task.type === 'send_message') {
                const msg = await client.sendMessage(entity, {
                    message: payload.message,
                    replyTo: topicId
                });
                if (payload.pin) {
                    await client.invoke(new Api.messages.UpdatePinnedMessage({
                        peer: entity,
                        id: msg.id,
                        pmOneside: true
                    }));
                }
            } else if (task.type === 'create_poll') {
                await client.invoke(new Api.messages.SendMedia({
                    peer: entity,
                    media: new Api.InputMediaPoll({
                        poll: new Api.Poll({
                            id: BigInt(Math.floor(Math.random() * 1000000)) as any,
                            question: new Api.TextWithEntities({ text: payload.question, entities: [] }),
                            answers: payload.options.map((opt: string) => new Api.PollAnswer({
                                text: new Api.TextWithEntities({ text: opt, entities: [] }),
                                option: Buffer.from(opt)
                            })),
                            closed: false,
                            publicVoters: true,
                            multipleChoice: false,
                            quiz: false,
                        })
                    }),
                    message: "",
                    replyTo: new Api.InputReplyToMessage({ replyToMsgId: topicId })
                }));

            } else if (task.type === 'rename_topic') {
                const { newTitle } = payload;
                if (!newTitle) throw new Error("newTitle is required");

                // If topicId not resolved yet (re-using logic above which resolves 'topicId' variable)
                // The block above sets 'topicId' variable, so we can use it.
                // Wait, 'topicId' is resolved at lines 174-183.
                // So if we are in this 'else if' block (task.type === 'rename_topic'), we can use it.
                // Wait, the `if (task.type === ...)` chain is inside logic that STARTS at line 166.
                // Yes, lines 166-183 setup client, entity and topicId.

                await client.invoke(new Api.channels.EditForumTopic({
                    channel: entity,
                    topicId: topicId,
                    title: newTitle
                }));
                console.log(`Renamed topic ${topicId} to ${newTitle}`);
            }
            // ... (implement other types as needed)
        }

        await sql`UPDATE unified_queue SET status = 'completed', error = NULL WHERE id = ${task.id}`;
        return true;

    } catch (error: any) {
        errorLog(`Task #${task.id} failed:`, error);

        // FloodWait
        if (error.seconds || error.errorMessage?.startsWith('FLOOD_WAIT_')) {
            const waitSeconds = error.seconds || parseInt(error.errorMessage.split('_')[2], 10) || 60;
            log(`FloodWait: ${waitSeconds}s`);
            await setFloodWait(waitSeconds);
            await sql`
                UPDATE unified_queue 
                SET status = 'pending', 
                    scheduled_at = NOW() + (${waitSeconds} || ' seconds')::INTERVAL, 
                    error = ${`FloodWait: ${waitSeconds}s`} 
                WHERE id = ${task.id}
            `;
            return false;
        }

        await sql`UPDATE unified_queue SET status = 'failed', error = ${error.message} WHERE id = ${task.id}`;
        return true;
    }
}

async function main() {
    log("Starting Worker (Unified)...");
    await initDatabase();

    // Connect TG
    try {
        const client = await getTelegramClient();
        if (client) log("Telegram Client connected.");
    } catch (e) { errorLog("TG Connection failed", e); }

    while (true) {
        try {
            const floodWait = await getFloodWait();
            if (floodWait > 0) {
                log(`FloodWait Global: ${floodWait}s`);
                await new Promise(r => setTimeout(r, floodWait * 1000));
                continue;
            }

            // Find oldest READY task
            // We optimized the query here to only fetch tasks that are ready
            // But for simplicity of strict ordering, we check head. 
            // Better:
            const readyTask = await sql`
                SELECT id FROM unified_queue 
                WHERE status = 'pending' AND scheduled_at <= NOW()
                LIMIT 1
            `;

            if (readyTask.length > 0) {
                await processUnifiedQueue();
                await new Promise(r => setTimeout(r, 1000)); // Buffer
            } else {
                await new Promise(r => setTimeout(r, 2000)); // Idle wait
            }

        } catch (e) {
            errorLog("Loop error", e);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

main().catch(e => {
    errorLog("Fatal Worker Error:", e);
    process.exit(1);
});
