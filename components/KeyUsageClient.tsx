"use client";

import { useState, useEffect } from "react";
import { getKeyUsageStats } from "@/app/actions/admin";
import { Loader2, KeyRound, Activity, BarChart3 } from "lucide-react";

export default function KeyUsageClient() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getKeyUsageStats();
            if (res.success) {
                setStats(res.stats || []);
            } else {
                console.error("Failed to fetch key usage stats: ", res.error);
            }
        } catch (e) {
            console.error("Error fetching stats:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to format numbers nicely (e.g. 10,000)
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-600" /> Key Usage Analytics
                </h1>
                <p className="text-gray-500 mt-2">
                    Review token consumption broken down by client API key and model.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : stats.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Usage Data Found</h3>
                    <p className="text-gray-500 mt-1">Token spending via LiteLLM will appear here once active.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {stats.map((providerGroup, index) => {
                        // Calculate totals for the group
                        const totalProviderTokens = providerGroup.models.reduce((sum: number, m: any) => sum + m.total_tokens, 0);
                        const totalProviderCost = providerGroup.models.reduce((sum: number, m: any) => sum + m.total_cost_usd, 0);

                        return (
                            <div key={providerGroup.credentialAlias || index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                                {/* Header for the Provider Group */}
                                <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <BarChart3 className="w-5 h-5 text-purple-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{providerGroup.credentialAlias}</h2>
                                            <p className="text-xs text-gray-500 font-mono">Upstream Provider Metrics</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Provider Spend</p>
                                            <p className="text-lg font-bold text-green-700">${totalProviderCost.toFixed(4)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Provider Tokens</p>
                                            <p className="text-lg font-bold text-gray-900">{formatNumber(totalProviderTokens)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Table of Model Usage for this Provider */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-gray-100 uppercase text-xs tracking-wider">Model</th>
                                                <th className="px-6 py-3 border-b border-gray-100 uppercase text-xs tracking-wider text-right">Prompt Tokens</th>
                                                <th className="px-6 py-3 border-b border-gray-100 uppercase text-xs tracking-wider text-right">Completion Tokens</th>
                                                <th className="px-6 py-3 border-b border-gray-100 uppercase text-xs tracking-wider text-right text-blue-700">Total Tokens</th>
                                                <th className="px-6 py-3 border-b border-gray-100 uppercase text-xs tracking-wider text-right text-green-700">Estimated Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {providerGroup.models.map((model: any, mIdx: number) => (
                                                <tr key={mIdx} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-gray-800">{model.modelName}</td>
                                                    <td className="px-6 py-3 text-right text-gray-600">{formatNumber(model.prompt_tokens)}</td>
                                                    <td className="px-6 py-3 text-right text-gray-600">{formatNumber(model.completion_tokens)}</td>
                                                    <td className="px-6 py-3 text-right font-semibold text-gray-900">{formatNumber(model.total_tokens)}</td>
                                                    <td className="px-6 py-3 text-right font-semibold text-green-700">${Number(model.total_cost_usd || 0).toFixed(4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
