"use client";

import { useState, useEffect } from "react";
import { getTemplateModels, bulkCreateModels, deleteAdminModel, updateAdminModel } from "@/app/actions/admin";
import { LiteLLMModel } from "@/lib/litellm";
import { Loader2, Check, AlertCircle, Copy, ArrowRight, Trash2, Edit2, X, Save } from "lucide-react";

export default function AddCredentialsPage() {
    const [keys, setKeys] = useState("");
    const [provider, setProvider] = useState("openai");
    const [templates, setTemplates] = useState<LiteLLMModel[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const [apiBase, setApiBase] = useState("");
    const [customProvider, setCustomProvider] = useState("");

    // State for managing existing models
    const [models, setModels] = useState<LiteLLMModel[]>([]);
    const [managingModels, setManagingModels] = useState(false);
    const [editingModelId, setEditingModelId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        api_key: "",
        api_base: "",
        custom_llm_provider: "",
    });

    const fetchModels = async () => {
        setLoading(true);
        const fetchedModels = await getTemplateModels();
        setModels(fetchedModels);
        setTemplates(fetchedModels);
        setLoading(false);
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const keyList = keys.split("\n").filter(k => k.trim() !== "");

    const handleCreate = async () => {
        if (!selectedTemplate || keyList.length === 0) return;

        setCreating(true);
        setResults([]);

        try {
            const res = await bulkCreateModels(provider, keyList, selectedTemplate, {
                apiBase: apiBase.trim() || undefined,
                customProvider: customProvider.trim() || undefined
            });
            if (res.success && res.results) {
                setResults(res.results);
                if (res.results.every((r: any) => r.status === 'created')) {
                    setKeys(""); // Clear input on full success
                    // Refresh models list
                    await fetchModels();
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

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete model ${id}?`)) return;

        setManagingModels(true);
        try {
            const res = await deleteAdminModel(id);
            if (res.success) {
                setModels(models.filter(m => m.id !== id));
            } else {
                alert("Failed to delete model: " + res.error);
            }
        } catch (e: any) {
            alert("Error deleting model: " + e.message);
        } finally {
            setManagingModels(false);
        }
    };

    const startEdit = (model: LiteLLMModel) => {
        setEditingModelId(model.id);
        setEditForm({
            api_key: model.litellm_params?.api_key || "",
            api_base: model.litellm_params?.api_base || "",
            custom_llm_provider: model.litellm_params?.custom_llm_provider || model.litellm_provider || "",
        });
    };

    const cancelEdit = () => {
        setEditingModelId(null);
        setEditForm({ api_key: "", api_base: "", custom_llm_provider: "" });
    };

    const handleUpdate = async (id: string, originalParams: any) => {
        setManagingModels(true);
        try {
            // Merge original params with updates.  LiteLLM needs all params when replacing a model
            const updatedParams = {
                ...originalParams,
                api_key: editForm.api_key || undefined,
                api_base: editForm.api_base || undefined,
                custom_llm_provider: editForm.custom_llm_provider || undefined,
            };

            // Remove empty strings or undefined to avoid overriding with nulls if they shouldn't
            Object.keys(updatedParams).forEach(key => {
                if (updatedParams[key] === "" || updatedParams[key] === undefined) {
                    delete updatedParams[key];
                }
            });

            const res = await updateAdminModel(id, updatedParams);
            if (res.success) {
                await fetchModels(); // Refresh list to get updated data
                setEditingModelId(null);
            } else {
                alert("Failed to update model: " + res.error);
            }
        } catch (e: any) {
            alert("Error updating model: " + e.message);
        } finally {
            setManagingModels(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="border-b border-gray-200 pb-5 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Credentials</h1>
                    <p className="text-gray-500 mt-2">
                        Add new credentials via templates or manage existing ones.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Batch Add Credentials</h2>
                    <div className="grid grid-cols-2 gap-4">
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
                                <option value="custom">Custom Provider</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Provider Name
                            </label>
                            <input
                                type="text"
                                value={customProvider}
                                onChange={(e) => setCustomProvider(e.target.value)}
                                placeholder="e.g. together_ai"
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Base / Proxy URL
                        </label>
                        <input
                            type="text"
                            value={apiBase}
                            onChange={(e) => setApiBase(e.target.value)}
                            placeholder="https://api.openai.com/v1"
                            className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                        />
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

                    {/* Results below create button */}
                    {results.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Creation Results</h3>
                            {results.map((res, i) => (
                                <div
                                    key={i}
                                    className={`p-2 rounded border flex items-center justify-between text-xs ${res.status === 'created'
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : "bg-red-50 border-red-200 text-red-800"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {res.status === 'created' ? (
                                            <Check className="w-3 h-3 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        <span className="truncate font-mono">{res.name}</span>
                                    </div>
                                    <span className="font-semibold uppercase tracking-wider">
                                        {res.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {/* Right Column: Existing Models */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[800px]">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Existing Credentials</h2>
                        {loading && !managingModels && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {models.length === 0 && !loading ? (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No models configured yet.
                            </div>
                        ) : (
                            models.map((model) => (
                                <div key={model.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-100 transition-colors bg-white shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-mono text-sm font-semibold text-gray-900">{model.id}</h3>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">
                                                Provider: {model.litellm_provider || "unknown"}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            {editingModelId !== model.id && (
                                                <button
                                                    onClick={() => startEdit(model)}
                                                    disabled={managingModels}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                    title="Edit configuration"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(model.id)}
                                                disabled={managingModels || editingModelId === model.id}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                title="Delete model"
                                            >
                                                {managingModels && !editingModelId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Edit Form */}
                                    {editingModelId === model.id ? (
                                        <div className="mt-4 space-y-3 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                                                <input
                                                    type="text"
                                                    value={editForm.api_key}
                                                    onChange={e => setEditForm({ ...editForm, api_key: e.target.value })}
                                                    placeholder="sk-..."
                                                    className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-blue-500 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">API Base URL</label>
                                                <input
                                                    type="text"
                                                    value={editForm.api_base}
                                                    onChange={e => setEditForm({ ...editForm, api_base: e.target.value })}
                                                    placeholder="Optional"
                                                    className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-blue-500 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Custom Provider Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.custom_llm_provider}
                                                    onChange={e => setEditForm({ ...editForm, custom_llm_provider: e.target.value })}
                                                    placeholder="Optional"
                                                    className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-blue-500 font-mono"
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end pt-2">
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={managingModels}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                                                >
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleUpdate(model.id, model.litellm_params || {})}
                                                    disabled={managingModels}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-1"
                                                >
                                                    {managingModels ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Read Only View */
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-2.5 rounded">
                                            <div className="truncate">
                                                <span className="font-medium text-gray-500 text-xs uppercase block mb-0.5">API Base</span>
                                                <span className="font-mono text-xs">{model.litellm_params?.api_base || "Default"}</span>
                                            </div>
                                            <div className="truncate">
                                                <span className="font-medium text-gray-500 text-xs uppercase block mb-0.5">API Key</span>
                                                <span className="font-mono text-xs">
                                                    {model.litellm_params?.api_key ?
                                                        `...${String(model.litellm_params.api_key).slice(-4)}` :
                                                        "None/Hidden"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

