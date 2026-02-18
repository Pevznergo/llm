"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List as ListIcon, Info } from "lucide-react";
import { LiteLLMModel } from "@/lib/litellm";

interface ModelsPageProps {
    models: LiteLLMModel[];
}

export default function ModelsPageClient({ models }: ModelsPageProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const filteredModels = models.filter(m =>
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.owned_by.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Grouping logic? Or flat list? OpenRouter has flat list but grouped by provider visually sometimes.
    // For now flat list.

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Models</h1>
                    <span className="text-gray-500 text-sm">{models.length} models</span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search models..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
                        />
                    </div>

                    {/* Compare button placeholder */}
                    <button className="hidden md:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                        <SlidersHorizontal className="w-4 h-4" />
                        Compare
                    </button>

                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 ${viewMode === "list" ? "bg-gray-100 text-black" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 ${viewMode === "grid" ? "bg-gray-100 text-black" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredModels.map(model => (
                    <div key={model.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{model.id}</h3>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <Info className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">
                                    by <span className="underline decoration-dotted">{model.owned_by}</span>
                                </p>
                                {/* Description placeholder */}
                                <p className="text-sm text-gray-600 line-clamp-2 max-w-3xl">
                                    {/* Create generic description based on model name */}
                                    This model is hosted by {model.owned_by}. It offers capabilities suitable for various tasks.
                                </p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                                {/* Placeholders for context/pricing since we don't have them in basic metadata */}
                                <div>Context: Unknown</div>
                                <div>Input: $?/1M</div>
                                <div>Output: $?/1M</div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredModels.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No models found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}
