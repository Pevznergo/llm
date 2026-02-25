import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
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
