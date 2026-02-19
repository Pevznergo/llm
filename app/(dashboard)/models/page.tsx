import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/litellm";
import ModelsPageClient from "@/components/ModelsPage";

export default async function ModelsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) return redirect("/login");

    const models = await getModels();

    // Deduplicate models by ID
    const uniqueModelsMap = new Map();
    models.forEach(m => {
        if (!uniqueModelsMap.has(m.id)) {
            uniqueModelsMap.set(m.id, m);
        }
    });

    // Sort models roughly? Or trust API order.
    // Let's sort alphabetically by id
    const sortedModels = Array.from(uniqueModelsMap.values()).sort((a: any, b: any) => a.id.localeCompare(b.id));

    return <ModelsPageClient models={sortedModels} />;
}
