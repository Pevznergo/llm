import { NextRequest, NextResponse } from "next/server";
import { updateManagedModelStatus, deleteManagedModel } from "@/lib/managed-models-db";
import { deleteModel } from "@/lib/litellm";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { status } = await req.json();
        const id = parseInt(params.id);

        if (!status) return NextResponse.json({ success: false, error: "Status required" }, { status: 400 });

        const modelRows = await sql`SELECT * FROM managed_models WHERE id = ${id}`;
        if (modelRows.length > 0) {
            const model = modelRows[0] as any;
            if (model.status === 'active' && status !== 'active') {
                const litellmModelId = model.model_info?.id || model.model_name;
                try {
                    await deleteModel(litellmModelId);
                } catch (e) { }
            }
        }

        const updated = await updateManagedModelStatus(id, status);
        return NextResponse.json({ success: true, model: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        const modelRows = await sql`SELECT * FROM managed_models WHERE id = ${id}`;
        if (modelRows.length > 0) {
            const model = modelRows[0] as any;
            if (model.status === 'active') {
                const litellmModelId = model.model_info?.id || model.model_name;
                try {
                    await deleteModel(litellmModelId);
                } catch (e) { }
            }
        }

        await deleteManagedModel(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
