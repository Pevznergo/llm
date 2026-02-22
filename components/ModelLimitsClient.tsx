"use client";

import { useState, useEffect } from "react";
import { getDailyModelLimits } from "@/app/actions/admin";
import { Loader2, Activity, Settings, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

type ModelLimit = {
    model_name: string;
    rld: string | number;
    consumed_today: string | number;
};

export default function ModelLimitsClient() {
    const [loading, setLoading] = useState(true);
    const [limits, setLimits] = useState<ModelLimit[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getDailyModelLimits();
            if (res.success) {
                setLimits(res.limits || []);
            } else {
                toast.error(res.error || "Failed to load model limits");
            }
        } catch (e) {
            console.error("Error fetching limits:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Show all connected models
    const activeData = limits;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-200 pb-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" /> Daily Model Limits
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Monitor the daily request limit (RLD) versus actual consumption per model. Limits can be set on the <a href="/admin/model-costs" className="text-blue-600 hover:underline">Model Costs</a> page.
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : activeData.length === 0 ? (
                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-gray-500">No connected models found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Model Name</th>
                                    <th className="px-6 py-3">Today&apos;s Usage</th>
                                    <th className="px-6 py-3">Daily Limit (RLD)</th>
                                    <th className="px-6 py-3 w-1/4">Capacity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeData.map((limit, idx) => {
                                    const rld = Number(limit.rld);
                                    const consumed = Number(limit.consumed_today);
                                    const hasLimit = rld > 0;
                                    const progressPercent = hasLimit ? Math.min((consumed / rld) * 100, 100) : 0;

                                    let barColor = "bg-blue-500";
                                    if (hasLimit) {
                                        if (progressPercent > 90) barColor = "bg-red-500";
                                        else if (progressPercent > 75) barColor = "bg-orange-500";
                                    }

                                    return (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-800">{limit.model_name}</td>
                                            <td className="px-6 py-4 text-gray-800 font-medium">{consumed.toLocaleString()} reqs</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {hasLimit ? <span className="font-semibold text-gray-700">{rld.toLocaleString()}</span> : <span className="italic text-gray-400">Unlimited</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasLimit ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                            <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${progressPercent}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-600 w-10 text-right">{progressPercent.toFixed(0)}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Tracking only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
