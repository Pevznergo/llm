"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MetricCardProps {
    title: string;
    value: string;
    data: any[];
    dataKey: string;
    modelColors: Record<string, string>;
    formatter?: (value: number) => string;
}

export function MetricCard({ title, value, data, dataKey, modelColors, formatter }: MetricCardProps) {
    // Calculate totals per model for the legend
    const modelTotals: Record<string, number> = {};
    data.forEach(day => {
        Object.keys(day).forEach(key => {
            if (key !== "date") {
                modelTotals[key] = (modelTotals[key] || 0) + (day[key]?.[dataKey] || 0);
            }
        });
    });

    // Sort models by value desc
    const sortedModels = Object.keys(modelTotals).sort((a, b) => modelTotals[b] - modelTotals[a]);

    // Top 5 models for legend
    const topModels = sortedModels.slice(0, 5);
    const otherValue = sortedModels.slice(5).reduce((acc, output) => acc + modelTotals[output], 0);

    // Prepare data with "Other" aggregated for the chart
    const enhancedData = data.map(day => {
        const newDay = { ...day };
        let dayOtherTotal = 0;

        // Sum up non-top models for this day
        Object.keys(day).forEach(key => {
            if (key !== "date" && !topModels.includes(key) && key !== "Other") {
                dayOtherTotal += (day[key]?.[dataKey] || 0);
            }
        });

        if (dayOtherTotal > 0) {
            newDay["Other"] = { [dataKey]: dayOtherTotal };
        }
        return newDay;
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-6">{value}</div>

            <div className="h-48 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enhancedData} barCategoryGap={2} barSize={12}>
                        {/* 
                           Stack top models + Others
                        */}
                        {topModels.map((model) => (
                            <Bar
                                key={model}
                                dataKey={`${model}.${dataKey}`}
                                stackId="a"
                                fill={modelColors[model] || "#E5E7EB"}
                                radius={[0, 0, 0, 0]} // No radius for stacked segments except top? Recharts handles this weirdly.
                            />
                        ))}
                        {otherValue > 0 && (
                            <Bar
                                key="Others"
                                dataKey={`Other.${dataKey}`}
                                stackId="a"
                                fill="#E5E7EB"
                                radius={[2, 2, 0, 0]} // Top radius for the last one
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-auto space-y-2">
                {topModels.map(model => (
                    <div key={model} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: modelColors[model] || "#E5E7EB" }}
                            />
                            <span className="text-gray-600 truncate max-w-[140px]" title={model}>
                                {model}
                            </span>
                        </div>
                        <span className="font-medium text-gray-900">
                            {formatter ? formatter(modelTotals[model]) : modelTotals[model].toLocaleString()}
                        </span>
                    </div>
                ))}
                {otherValue > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-200" />
                            <span className="text-gray-600">Others</span>
                        </div>
                        <span className="font-medium text-gray-900">
                            {formatter ? formatter(otherValue) : otherValue.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
