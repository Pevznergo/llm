import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS model_dispatcher_templates (
            id SERIAL PRIMARY KEY,
            template_name VARCHAR(255) UNIQUE NOT NULL,
            litellm_name VARCHAR(255) NOT NULL,
            public_name VARCHAR(255) NOT NULL,
            api_base VARCHAR(1024),
            pricing_input DECIMAL(10, 6) DEFAULT 0,
            pricing_output DECIMAL(10, 6) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
}

export async function GET() {
    try {
        await ensureTable();
        const templates = await sql`
            SELECT * FROM model_dispatcher_templates 
            ORDER BY created_at DESC
        `;
        return NextResponse.json({ templates });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureTable();
        const body = await req.json();
        const { template_name, litellm_name, public_name, api_base, pricing_input, pricing_output } = body;

        if (!template_name || !litellm_name || !public_name) {
            return NextResponse.json({ error: "Missing required fields (template_name, litellm_name, public_name)" }, { status: 400 });
        }

        const result = await sql`
            INSERT INTO model_dispatcher_templates (
                template_name, litellm_name, public_name, api_base, pricing_input, pricing_output
            ) VALUES (
                ${template_name}, ${litellm_name}, ${public_name}, ${api_base || null}, ${pricing_input || 0}, ${pricing_output || 0}
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, template: result[0] });
    } catch (e: any) {
        // Handle unique constraint violation for duplicate template names
        if (e.code === '23505') {
            return NextResponse.json({ error: "A template with this name already exists." }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
