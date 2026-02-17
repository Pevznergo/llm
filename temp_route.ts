import { NextRequest, NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    console.log("API /topic-queue/list called");
    try {
        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL missing in API");
        } else {
            console.log("DATABASE_URL present:", process.env.DATABASE_URL.substring(0, 30) + "...");
        }

        await initDatabase();

        const searchParams = req.nextUrl.searchParams;
        const showCompleted = searchParams.get('show_completed') === 'true';
        console.log("showCompleted:", showCompleted);

        // Fetch topic actions
        let topicTasks;
        if (showCompleted) {
            topicTasks = await sql`
                SELECT id, chat_id, action_type, status, error, scheduled_for, created_at, payload
                FROM topic_actions_queue
                WHERE status != 'completed' 
                   OR (status = 'completed' AND created_at > NOW() - INTERVAL '24 HOURS')
                ORDER BY created_at DESC
                LIMIT 100
            `;
        } else {
            topicTasks = await sql`
                SELECT id, chat_id, action_type, status, error, scheduled_for, created_at, payload
                FROM topic_actions_queue
                WHERE status != 'completed'
                ORDER BY created_at DESC
                LIMIT 100
            `;
        }
        console.log("Topic Tasks found:", topicTasks.length);

        // Fetch chat creation tasks
        let createTasks;
        if (showCompleted) {
            createTasks = await sql`
                SELECT id, title, status, error, scheduled_at, created_at
                FROM chat_creation_queue
                WHERE status != 'completed' 
                   OR (status = 'completed' AND created_at > NOW() - INTERVAL '24 HOURS')
                ORDER BY created_at DESC
                LIMIT 100
            `;
        } else {
            createTasks = await sql`
                SELECT id, title, status, error, scheduled_at, created_at
                FROM chat_creation_queue
                WHERE status != 'completed'
                ORDER BY created_at DESC
                LIMIT 100
            `;
        }
        console.log("Create Tasks found:", createTasks.length);

        // Normalize and merge
        const unifiedTasks = [
            ...topicTasks.map(t => ({
                unique_id: `topic-${t.id}`,
                id: t.id,
                chat_id: t.chat_id,
                action_type: t.action_type,
                status: t.status,
                error: t.error,
                scheduled_for: t.scheduled_for,
                created_at: t.created_at,
                source: 'topic'
            })),
            ...createTasks.map(t => ({
                unique_id: `create-${t.id}`,
                id: t.id,
                chat_id: 'New Chat',
                action_type: `CREATE: ${t.title}`,
                status: t.status,
                error: t.error,
                scheduled_for: t.scheduled_at, // Use scheduled_at for scheduling time
                created_at: t.created_at,
                source: 'create'
            }))
        ].sort((a, b) => {
            // Sort: Pending/Processing/Failed first, then new to old
            const scoreA = ['pending', 'processing', 'failed'].includes(a.status) ? 0 : 1;
            const scoreB = ['pending', 'processing', 'failed'].includes(b.status) ? 0 : 1;

            if (scoreA !== scoreB) return scoreA - scoreB;

            // If same group, sort by created_at desc (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }).slice(0, 50);

        return NextResponse.json({ tasks: unifiedTasks });
    } catch (e: any) {
        console.error("API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
