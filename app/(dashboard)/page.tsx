import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUser, listKeys } from "@/lib/litellm";
import { getDailyStats } from "@/app/actions/logs";
import { ActivityCharts } from "@/components/ActivityCharts";
import { CreditCard, Activity, Key } from "lucide-react";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) return redirect("/login");

  const email = session.user.email;

  // Fetch data in parallel
  const userPromise = getUser(email);
  const keysPromise = listKeys(email);
  const statsPromise = getDailyStats();

  const [user, keys, statsResult] = await Promise.all([userPromise, keysPromise, statsPromise]);

  const { dailyStats = [], error } = statsResult;

  // Calculate totals from stats if needed, or use user object
  // Using user object for total life-time spend/requests is better if LiteLLM aggregates it.
  // But charts need dailyStats.

  // Format stats for client component
  const chartData = dailyStats.map((stat: any) => ({
    date: new Date(stat.date).toISOString(),
    spend: Number(stat.spend),
    requests: Number(stat.requests),
    tokens: Number(stat.tokens)
  }));

  // Use LiteLLM aggregated stats for the cards
  const spend = user?.spend || 0;
  const requestCount = user?.request_count || 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity</h1>
        <div className="text-sm text-gray-500">
          {email}
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full text-green-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${spend.toFixed(4)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requestCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-full text-purple-600">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Keys</p>
              <p className="text-2xl font-bold text-gray-900">{keys.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Error loading activity data: {error}
          </div>
        ) : (
          <ActivityCharts data={chartData} />
        )}
      </div>
    </div>
  );
}
