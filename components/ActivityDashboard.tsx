"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MetricCard } from "./MetricCard";
import { ChevronDown, Settings } from "lucide-react";
import { subDays, subMonths, format, startOfToday } from "date-fns";

interface ActivityDashboardProps {
    initialStats: any[]; // Raw stats from DB
}

export function ActivityDashboard({ initialStats }: ActivityDashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Determine initial label based on URL or default
    const getInitialLabel = () => {
        const start = searchParams.get("startDate");
        if (!start) return "1 Month";
        const today = new Date();
        const startDate = new Date(start);
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) return "1 Week";
        if (diffDays <= 32) return "1 Month";
        if (diffDays <= 92) return "3 Months";
        return "Custom";
    };

    const [timeRange, setTimeRange] = useState(getInitialLabel());
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleRangeChange = (range: string) => {
        setTimeRange(range);
        setIsFilterOpen(false);

        const today = startOfToday();
        let start;

        switch (range) {
            case "1 Week":
                start = subDays(today, 7);
                break;
            case "1 Month":
                start = subMonths(today, 1);
                break;
            case "3 Months":
                start = subMonths(today, 3);
                break;
            default:
                start = subMonths(today, 1);
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set("startDate", format(start, "yyyy-MM-dd"));
        params.set("endDate", format(today, "yyyy-MM-dd"));
        router.push("?" + params.toString());
    };

    // Process data for charts
    // Structure: [{ date: '2023-01-01', 'gpt-4': { spend: 0.1, count: 2, tokens: 100 }, 'claude-2': { ... } }]
    const processedData = useMemo(() => {
        const dataMap: Record<string, any> = {};
        const models = new Set<string>();

        initialStats.forEach(stat => {
            const date = new Date(stat.date).toISOString().split('T')[0];
            if (!dataMap[date]) {
                dataMap[date] = { date };
            }
            const model = stat.model || "Unknown";
            models.add(model);
            dataMap[date][model] = {
                spend: Number(stat.spend),
                count: Number(stat.count),
                tokens: Number(stat.tokens)
            };
        });

        // Fill gaps if needed (optional)

        // Assign colors to models
        const colors = [
            "#F59E0B", // Amber
            "#3B82F6", // Blue
            "#10B981", // Emerald
            "#8B5CF6", // Violet
            "#EC4899", // Pink
            "#6366F1", // Indigo
            "#EF4444", // Red
        ];
        const modelColors: Record<string, string> = {};
        Array.from(models).forEach((model, i) => {
            modelColors[model] = colors[i % colors.length];
        });

        return {
            chartData: Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date)),
            modelColors
        };
    }, [initialStats]);

    // Calculate overall totals
    const totals = useMemo(() => {
        let totalSpend = 0;
        let totalRequests = 0;
        let totalTokens = 0;

        initialStats.forEach(stat => {
            totalSpend += Number(stat.spend);
            totalRequests += Number(stat.count);
            totalTokens += Number(stat.tokens);
        });

        return { totalSpend, totalRequests, totalTokens };
    }, [initialStats]);

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    const formatNumber = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Activity</h1>
                    <p className="text-gray-500">Your usage across models</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
                        <span className="w-4 h-4"><Settings className="w-4 h-4" /></span>
                        <span>Filters</span>
                    </div>
                    <div className="relative">
                        <div
                            className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 min-w-[120px]"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <span>{timeRange}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                                {["1 Week", "1 Month", "3 Months"].map((range) => (
                                    <div
                                        key={range}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleRangeChange(range)}
                                    >
                                        {range}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Spend"
                    value={formatCurrency(totals.totalSpend)}
                    data={processedData.chartData}
                    dataKey="spend"
                    modelColors={processedData.modelColors}
                    formatter={formatCurrency}
                />
                <MetricCard
                    title="Requests"
                    value={totals.totalRequests.toLocaleString()}
                    data={processedData.chartData}
                    dataKey="count"
                    modelColors={processedData.modelColors}
                />
                <MetricCard
                    title="Tokens"
                    value={formatNumber(totals.totalTokens)}
                    data={processedData.chartData}
                    dataKey="tokens"
                    modelColors={processedData.modelColors}
                    formatter={formatNumber}
                />
            </div>
        </div>
    );
}
