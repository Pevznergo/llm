import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/litellm";
import CreditsPageClient from "@/components/CreditsPage";

export default async function CreditsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) return redirect("/login");

    const user = await getUser(session.user.email);

    // Calculate balance: max_budget - spend
    // If max_budget is null/undefined, treat as 0 or infinite? 
    // Usually max_budget is the limit.
    // If we want "Current Balance" (Credits left), it's max_budget - spend.
    // If max_budget is missing, maybe default to 0.
    const maxBudget = user?.max_budget || 0;
    const spend = user?.spend || 0;
    const balance = Math.max(0, maxBudget - spend);

    return <CreditsPageClient balance={balance} />;
}
