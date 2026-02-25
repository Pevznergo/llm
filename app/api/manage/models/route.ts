import { NextRequest, NextResponse } from "next/server";
import { addManagedModel, getManagedModels } from "@/lib/managed-models-db";

export async function GET() {
    const models = await getManagedModels();
    return NextResponse.json({ success: true, models });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { model_name, litellm_params, model_info, daily_request_limit } = body;

        if (!model_name || !litellm_params || typeof daily_request_limit !== 'number') {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const newModel = await addManagedModel(model_name, litellm_params, model_info || {}, daily_request_limit);
        return NextResponse.json({ success: true, model: newModel });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
