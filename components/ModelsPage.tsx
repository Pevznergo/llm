"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List as ListIcon, Info, Box, Copy, Check } from "lucide-react";
import { LiteLLMModel } from "@/lib/litellm";
import { getModelMetadata } from "@/lib/model-data";

interface ModelsPageProps {
    models: LiteLLMModel[];
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-700"
            title="Copy model ID"
        >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}

export default function ModelsPageClient({ models }: ModelsPageProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    // Deduplicate models by ID
    const uniqueModels = models.filter((model, index, self) =>
        index === self.findIndex((t) => t.id === model.id)
    );

    const filteredModels = uniqueModels.filter(m =>
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.owned_by && m.owned_by.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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

            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {filteredModels.map(model => {
                    const metadata = getModelMetadata(model.id);
                    // Provider Mapping
                    const rawProvider = model.litellm_provider || model.owned_by || metadata.provider || "Unknown";
                    const providerMap: Record<string, string> = {
                        "gemini": "Google",
                        "anthropic": "Anthropic",
                        "openai": "OpenAI",
                        "mistral": "Mistral",
                        "meta": "Meta",
                        "scira": "Scira"
                    };
                    const provider = providerMap[rawProvider.toLowerCase()] || rawProvider;

                    // Format Prices
                    const inputPrice = model.input_cost_per_token
                        ? `$${(model.input_cost_per_token * 1000000).toFixed(2)}`
                        : metadata.inputPrice;

                    const outputPrice = model.output_cost_per_token
                        ? `$${(model.output_cost_per_token * 1000000).toFixed(2)}`
                        : metadata.outputPrice;

                    // Format Context
                    const contextLength = model.max_input_tokens
                        ? `${(model.max_input_tokens / 1000).toFixed(0)}K`
                        : metadata.contextLength;

                    // Description REMOVED per user request
                    const displayName = model.display_name || metadata.displayName || model.id;

                    // Copy handler
                    const handleCopy = (e: React.MouseEvent, text: string) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigator.clipboard.writeText(text);
                        // Visual feedback handled locally if we make this a component, 
                        // but for now simple alert or just relying on hover? 
                        // Better to make a small inline component or state.
                        // Since we are mapping, we can't easily usage simple state without a component.
                        // Let's usage a simpler approach: change icon briefly?
                        // Actually, let's extract a small row component or usage a data attribute?
                        // No, let's just make a CopyButton component inside.
                    };

                    if (viewMode === "grid") {
                        return (
                            <div key={model.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors shadow-sm flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Box className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                        {provider}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1" title={model.id}>
                                    {displayName}
                                </h3>

                                {/* API Model ID + Copy */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-mono line-clamp-1 break-all">
                                        {model.id}
                                    </span>
                                    <CopyButton text={model.id} />
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                                    <div>
                                        <span className="block text-gray-400 mb-1">Context</span>
                                        {contextLength}
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-gray-400 mb-1">Input / Output (1M)</span>
                                        {inputPrice} / {outputPrice}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // List View
                    return (
                        <div key={model.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">
                                            {model.id}
                                            <CopyButton text={model.id} />
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        by <span className="font-medium text-gray-700">{provider}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-8 text-sm text-gray-500 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Context</div>
                                        <div className="font-medium text-gray-900">{contextLength}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Input Price (1M)</div>
                                        <div className="font-medium text-gray-900">{inputPrice}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Output Price (1M)</div>
                                        <div className="font-medium text-gray-900">{outputPrice}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredModels.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No models found matching &quot;{searchTerm}&quot;
                    </div>
                )}
            </div>
        </div>
    );
}
