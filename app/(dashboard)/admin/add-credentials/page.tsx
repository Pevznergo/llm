"use client";

import { useState, useEffect } from "react";
import { getTemplateModels, bulkCreateModels, getModelTemplates, addModelTemplate, deleteModelTemplate, adminGetAllKeys } from "@/app/actions/admin";
import { LiteLLMModel, LiteLLMKey } from "@/lib/litellm";
import { Loader2, Key, Check, AlertCircle, Copy, Trash2, Edit2, Play, Plus, BookTemplate } from "lucide-react";

export default function AddCredentialsPage() {
    // State
    const [provider, setProvider] = useState("gemini");
    const [manualApiKey, setManualApiKey] = useState("");
    const [selectedProxyKey, setSelectedProxyKey] = useState("");

    // Data
    const [templates, setTemplates] = useState<any[]>([]);
    const [models, setModels] = useState<LiteLLMModel[]>([]);
    const [proxyKeys, setProxyKeys] = useState<LiteLLMKey[]>([]);

    // Selections
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [managingTemplates, setManagingTemplates] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [createResult, setCreateResult] = useState<{ success: boolean, message: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        // Fetch templates
        const tplRes = await getModelTemplates();
        if (tplRes.success) setTemplates(tplRes.templates || []);

        // Fetch models
        const fetchedModels = await getTemplateModels();
        setModels(fetchedModels || []);

        // Fetch proxy keys
        const keysRes = await adminGetAllKeys();
        if (keysRes.success) setProxyKeys(keysRes.keys || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBulkCreate = async () => {
        const activeApiKey = manualApiKey.trim() || selectedProxyKey.trim();

        if (!activeApiKey) {
            setCreateResult({ success: false, message: "Please provide or select a Master API Key." });
            return;
        }

        if (selectedTemplateIds.length === 0) {
            setCreateResult({ success: false, message: "Please select at least one template." });
            return;
        }

        setCreating(true);
        setCreateResult(null);

        // Get names of selected templates
        const selectedNames = templates
            .filter(t => selectedTemplateIds.includes(t.id))
            .map(t => t.template_name);

        try {
            const res = await bulkCreateModels(
                activeApiKey,
                selectedNames,
                provider
            );

            if (res.success && res.results) {
                const successCount = res.results.filter((r: any) => r.status === "created").length;
                setCreateResult({ success: true, message: `Successfully created ${successCount} models.` });
                await fetchData(); // Refresh models list
            } else {
                setCreateResult({ success: false, message: "Error: " + (res.error || "Unknown error") });
            }
        } catch (e: any) {
            setCreateResult({ success: false, message: "Failed: " + e.message });
        } finally {
            setCreating(false);
        }
    };

    const handleAddTemplate = async () => {
        if (!newTemplateName.trim()) return;
        setManagingTemplates(true);
        try {
            const res = await addModelTemplate(newTemplateName.trim(), provider);
            if (res.success) {
                setNewTemplateName("");
                await fetchData();
            } else {
                alert("Failed to add template: " + res.error);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setManagingTemplates(false);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        setManagingTemplates(true);
        try {
            const res = await deleteModelTemplate(id);
            if (res.success) {
                await fetchData();
                setSelectedTemplateIds(prev => prev.filter(tid => tid !== id));
            } else {
                alert("Failed to delete template: " + res.error);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setManagingTemplates(false);
        }
    };

    const toggleTemplateSelection = (id: number) => {
        setSelectedTemplateIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    // Filter templates for current provider visually
    const currentProviderTemplates = templates.filter(t => t.provider === provider || t.provider === 'all');

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900">Mass Model Creation</h1>
                <p className="text-gray-500 mt-2">
                    Select a master credential and apply it to multiple model templates simultaneously.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Constructor */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-500" /> 1. Master Credentials
                    </h2>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Provider
                            </label>
                            <select
                                value={provider}
                                onChange={(e) => {
                                    setProvider(e.target.value);
                                    setSelectedTemplateIds([]); // Reset selection on provider change
                                }}
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="gemini">Google (Gemini)</option>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="azure">Azure OpenAI</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Existing LiteLLM Master Key
                            </label>
                            <select
                                value={selectedProxyKey}
                                onChange={(e) => {
                                    setSelectedProxyKey(e.target.value);
                                    if (e.target.value) setManualApiKey("");
                                }}
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            >
                                <option value="">-- Select Master Key --</option>
                                {proxyKeys.map(k => (
                                    <option key={k.token || k.key} value={k.token || k.key}>
                                        {k.key_alias || 'Unnamed'} ({String(k.token || k.key).substring(0, 15)}...)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-medium">OR Enter Manually</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Manual Provider API Key
                            </label>
                            <input
                                type="password"
                                value={manualApiKey}
                                onChange={(e) => {
                                    setManualApiKey(e.target.value);
                                    if (e.target.value) setSelectedProxyKey("");
                                }}
                                placeholder="sk-..."
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2 mt-8">
                        <BookTemplate className="w-5 h-5 text-purple-500" /> 2. Select Templates
                    </h2>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">

                        {/* Custom Template Adder */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="Add new model template (e.g. gemini-1.5-pro)"
                                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
                            />
                            <button
                                onClick={handleAddTemplate}
                                disabled={managingTemplates || !newTemplateName.trim()}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm flex items-center gap-1 disabled:opacity-50"
                            >
                                {managingTemplates ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                            </button>
                        </div>

                        {/* Template List */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {currentProviderTemplates.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No templates found for this provider. Add one above.</p>
                            ) : (
                                currentProviderTemplates.map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedTemplateIds.includes(t.id)}
                                                onChange={() => toggleTemplateSelection(t.id)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="font-mono text-sm font-medium text-gray-800">{t.template_name}</span>
                                        </label>
                                        <button
                                            onClick={() => handleDeleteTemplate(t.id)}
                                            disabled={managingTemplates}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                                Selected: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{selectedTemplateIds.length}</span>
                            </span>

                            <button
                                onClick={handleBulkCreate}
                                disabled={creating || selectedTemplateIds.length === 0 || (!manualApiKey && !selectedProxyKey)}
                                className="py-2.5 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" /> Create Models
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Results block */}
                        {createResult && (
                            <div className={`mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${createResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`flex items-start gap-2 ${createResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {createResult.success ? <Check className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                                    <div>
                                        <p className="font-semibold text-sm">{createResult.message}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Existing Models Viewer */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[850px]">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Active LiteLLM Models</h2>
                            <p className="text-xs text-gray-500">Models configured and ready to be routed.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                                Total: {models.length}
                            </span>
                            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {models.length === 0 && !loading ? (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No models configured yet.
                            </div>
                        ) : (
                            models.map((model) => (
                                <div key={model.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-200 transition-colors bg-white shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-mono text-sm font-bold text-gray-900">{model.id}</h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${model.litellm_provider === 'gemini' ? 'bg-blue-100 text-blue-700' :
                                            model.litellm_provider === 'openai' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {model.litellm_provider || model.litellm_params?.custom_llm_provider || "unknown"}
                                        </span>
                                    </div>
                                    <div className="w-full h-px bg-gray-100 mt-1"></div>
                                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                        <div className="flex justify-between truncate gap-4">
                                            <span className="font-medium text-gray-400 uppercase">API Key</span>
                                            <span className="font-mono truncate max-w-[150px]">
                                                {model.litellm_params?.api_key ?
                                                    `...${String(model.litellm_params.api_key).slice(-6)}` :
                                                    "None/Hidden"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

