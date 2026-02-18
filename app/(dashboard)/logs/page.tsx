import { getRequestLogs, getLogsStats } from "@/app/actions/logs";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { LogsChart } from "@/components/LogsChart";
import { DateRangePicker } from "@/components/DateRangePicker";

export default async function LogsPage({
    searchParams,
}: {
    searchParams: { page?: string, startDate?: string, endDate?: string };
}) {
    const page = Number(searchParams.page) || 1;
    const startDate = searchParams.startDate;
    const endDate = searchParams.endDate;

    // Fetch data in parallel
    const logsPromise = getRequestLogs(page, 50, startDate, endDate);
    const statsPromise = getLogsStats(startDate, endDate);

    const [{ logs, total, totalPages, error }, { chartData }] = await Promise.all([
        logsPromise,
        statsPromise
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold">Logs</h1>
                <DateRangePicker />
            </div>

            {/* Chart Section */}
            {chartData && chartData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Requests over time</h3>
                    <LogsChart data={chartData} />
                </div>
            )}

            {error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Timestamp</th>
                                    <th className="px-6 py-3">Provider / Model</th>
                                    <th className="px-6 py-3">App</th>
                                    <th className="px-6 py-3">Tokens</th>
                                    <th className="px-6 py-3">Cost</th>
                                    <th className="px-6 py-3">Speed</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No logs found for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.request_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {format(new Date(log.startTime), "MMM d, HH:mm:ss")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {/* Placeholder for provider icon */}
                                                    <span className="font-medium text-gray-900">{log.model}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    {log.app}
                                                    {/* Link to key/user details if possible */}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex flex-col">
                                                    <span>{log.total_tokens || 0}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {log.prompt_tokens} → {log.completion_tokens}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-600">
                                                ${(log.spend || 0).toFixed(6)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {log.latency > 0 ? `${(log.latency / 1000).toFixed(2)}s` : "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'success'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} results
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/logs?page=${page - 1}${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`}
                                    className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                                <Link
                                    href={`/logs?page=${page + 1}${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`}
                                    className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
