import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/litellm";
import ModelsPageClient from "@/components/ModelsPage";

export default async function ModelsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) return redirect("/login");

    const models = await getModels();

    // Sort models roughly? Or trust API order.
    // Let's sort alphabetically by id
    const sortedModels = models.sort((a, b) => a.id.localeCompare(b.id));

    return <ModelsPageClient models={sortedModels} />;
}
