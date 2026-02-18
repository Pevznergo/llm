import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModelUsageStats } from "@/app/actions/logs";
import { ActivityDashboard } from "@/components/ActivityDashboard";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) return redirect("/login");

  // Fetch stats (default 30 days handling in action if no dates provided)
  const { chartData } = await getModelUsageStats(searchParams.startDate, searchParams.endDate);

  return (
    <ActivityDashboard initialStats={chartData} />
  );
}
