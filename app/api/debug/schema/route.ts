import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;

        let logsColumns = [];
        const logsTable = tables.find((t: any) => t.table_name === 'LiteLLM_SpendLogs' || t.table_name === 'spend_logs');

        if (logsTable) {
            logsColumns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${logsTable.table_name}
            `;

            // Fetch 5 sample rows
            const sampleLogs = await sql`
                SELECT * FROM "LiteLLM_SpendLogs" LIMIT 5
            `;
            return NextResponse.json({ tables, logsColumns, sampleLogs });
        }

        return NextResponse.json({ tables, logsColumns });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
