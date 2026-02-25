import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { stopGostContainer } from '../../gost_manager';
import axios from 'axios';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        // Fetch model info to delete LiteLLM route and kill gost
        const models = await sql`SELECT * FROM managed_models WHERE id = ${id}`;
        if (models.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const model = models[0];

        // 1. Kill Gost Container if exists
        if (model.gost_container_id) {
            try {
                await stopGostContainer(model.gost_container_id);
            } catch (e: any) {
                console.warn(`[API] Could not stop gost container ${model.gost_container_id}:`, e);
            }
        }

        // 2. Delete from LiteLLM if it was active and had an ID registered
        if (model.litellm_model_id) {
            try {
                const masterKey = process.env.LITELLM_MASTER_KEY;
                await axios.post('http://127.0.0.1:4000/model/delete', {
                    id: model.litellm_model_id
                }, {
                    headers: { 'Authorization': `Bearer ${masterKey}` }
                });

                // Flush router cache so changes reflect instantly
                await axios.post('http://127.0.0.1:4000/cache/redis/flushall', {}, {
                    headers: { 'Authorization': `Bearer ${masterKey}` }
                });
            } catch (e: any) {
                console.warn(`[API] Could not delete model from LiteLLM:`, e.message);
            }
        }

        // 3. Remove from Database
        await sql`DELETE FROM managed_models WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
