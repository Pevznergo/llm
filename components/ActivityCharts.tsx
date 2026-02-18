"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';

interface ActivityChartsProps {
    data: {
        date: string; // ISO string
        spend: number;
        requests: number;
        tokens: number;
    }[];
}

export function ActivityCharts({ data }: ActivityChartsProps) {
    const [activeTab, setActiveTab] = useState<'spend' | 'requests' | 'tokens'>('spend');

    // Format data for display
    const formattedData = data.map(item => ({
        ...item,
        dateStr: format(new Date(item.date), 'MMM d'),
        spend: Number(item.spend),
        requests: Number(item.requests),
        tokens: Number(item.tokens)
    }));

    const renderChart = (dataKey: string, color: string, unit: string) => (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="dateStr"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => unit === '$' ? `$${value}` : value.toLocaleString()}
                />
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [unit === '$' ? `$${Number(value).toFixed(4)}` : Number(value).toLocaleString(), activeTab.charAt(0).toUpperCase() + activeTab.slice(1)]}
                />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    fillOpacity={1}
                    fill={`url(#color${dataKey})`}
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-semibold text-gray-900">Activity (30 Days)</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['spend', 'requests', 'tokens'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[350px] w-full">
                {activeTab === 'spend' && renderChart('spend', '#10B981', '$')}
                {activeTab === 'requests' && renderChart('requests', '#3B82F6', '')}
                {activeTab === 'tokens' && renderChart('tokens', '#8B5CF6', '')}
            </div>
        </div>
    );
}
