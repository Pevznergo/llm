"use client";

import { useState, useEffect } from "react";
import { getTemplateModels, bulkCreateModels } from "@/app/actions/admin";
import { LiteLLMModel } from "@/lib/litellm";
import { Loader2, Check, AlertCircle, Copy, ArrowRight } from "lucide-react";

export default function AddCredentialsPage() {
    const [keys, setKeys] = useState("");
    const [provider, setProvider] = useState("openai");
    const [templates, setTemplates] = useState<LiteLLMModel[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        getTemplateModels().then((models) => {
            setTemplates(models);
            setLoading(false);
        });
    }, []);

    const keyList = keys.split("\n").filter(k => k.trim() !== "");

    // Preview generation
    // In a real app we might want server-side preview if logic is complex, 
    // but here we just show what we WILL send.
    // The exact names are generated on server to ensure uniqueness/randomness, 
    // so we can't fully preview exact names here without a roundtrip, 
    // but we can show the count and structure.

    const handleCreate = async () => {
        if (!selectedTemplate || keyList.length === 0) return;

        setCreating(true);
        setResults([]);

        try {
            const res = await bulkCreateModels(provider, keyList, selectedTemplate);
            if (res.success && res.results) {
                setResults(res.results);
                if (res.results.every((r: any) => r.status === 'created')) {
                    setKeys(""); // Clear input on full success
                }
            } else {
                alert("Error: " + res.error);
            }
        } catch (e: any) {
            alert("Failed: " + e.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900">Add Credentials</h1>
                <p className="text-gray-500 mt-2">
                    Bulk create models by applying new credentials to existing model templates.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provider
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="azure">Azure OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="mistral">Mistral</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Base Template Model
                        </label>
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-500 p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
                            </div>
                        ) : (
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                            >
                                <option value="">Select a model...</option>
                                {templates.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.id} ({m.litellm_provider || "unknown"})
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            New models will copy settings from this model.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Keys (One per line)
                        </label>
                        <textarea
                            value={keys}
                            onChange={(e) => setKeys(e.target.value)}
                            rows={8}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none font-mono text-sm"
                            placeholder="sk-..."
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500">
                                {keyList.length} key{keyList.length !== 1 ? 's' : ''} detected
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating || !selectedTemplate || keyList.length === 0}
                        className="w-full py-2.5 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Create {keyList.length} Models <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Right Column: Preview/Results */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {results.length > 0 ? "Creation Results" : "Preview"}
                    </h3>

                    {results.length > 0 ? (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {results.map((res, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-lg border flex items-center justify-between text-sm ${res.status === 'created'
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : "bg-red-50 border-red-200 text-red-800"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {res.status === 'created' ? (
                                            <Check className="w-4 h-4 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        )}
                                        <span className="truncate font-mono">{res.name}</span>
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                        {res.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 space-y-4">
                            {!selectedTemplate ? (
                                <p className="text-center py-10 italic">
                                    Select a template and add keys to see preview.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <p>Based on <strong>{selectedTemplate}</strong>, the following models will be created:</p>
                                    <div className="space-y-2">
                                        {keyList.slice(0, 5).map((_, i) => (
                                            <div key={i} className="flex items-center gap-2 text-gray-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                                <span className="font-mono">{selectedTemplate}-copy-pro...</span>
                                            </div>
                                        ))}
                                        {keyList.length > 5 && (
                                            <div className="pl-4 italic text-xs">
                                                ...and {keyList.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                    {keyList.length > 0 && (
                                        <div className="rounded bg-yellow-50 text-yellow-800 p-3 text-xs border border-yellow-200 mt-4">
                                            Unique suffixes will be generated for each model name to avoid collisions.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
