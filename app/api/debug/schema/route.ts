import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
    const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `;

    const tokenColumns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'LiteLLM_VerificationToken'
    `;

    return NextResponse.json({ tables: tables.map(t => t.table_name), tokenColumns });
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}
