"use client";

import { useState, useEffect } from "react";
import {
    getTemplateModels,
    bulkCreateModels,
    getModelTemplates,
    addModelTemplate,
    deleteModelTemplate,
    getProviderCredentials,
    addProviderCredential,
    deleteProviderCredential
} from "@/app/actions/admin";
import { LiteLLMModel } from "@/lib/litellm";
import { Loader2, Check, AlertCircle, Trash2, Play, Plus, BookTemplate, SaveIcon, KeyRound } from "lucide-react";

export default function AddCredentialsPage() {
    // Shared State
    const [loading, setLoading] = useState(true);

    // Credentials State
    const [credentials, setCredentials] = useState<any[]>([]);
    const [credProvider, setCredProvider] = useState("gemini");
    const [credAlias, setCredAlias] = useState("");
    const [credApiKey, setCredApiKey] = useState("");
    const [managingCreds, setManagingCreds] = useState(false);

    // Template State
    const [templates, setTemplates] = useState<any[]>([]);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [managingTemplates, setManagingTemplates] = useState(false);

    // Creation State
    const [selectedCredId, setSelectedCredId] = useState<string>("");
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
    const [creating, setCreating] = useState(false);
    const [createResult, setCreateResult] = useState<{ success: boolean, message: string } | null>(null);

    // Active Models State
    const [models, setModels] = useState<LiteLLMModel[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [credRes, tplRes, fetchedModels] = await Promise.all([
                getProviderCredentials(),
                getModelTemplates(),
                getTemplateModels() // Gets active models actually
            ]);

            if (credRes.success) setCredentials(credRes.credentials || []);
            if (tplRes.success) setTemplates(tplRes.templates || []);
            setModels(fetchedModels || []);
        } catch (e) {
            console.error("Failed to fetch data", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Actions ---

    const handleSaveCredential = async () => {
        if (!credAlias.trim() || !credApiKey.trim()) return;
        setManagingCreds(true);
        const res = await addProviderCredential(credProvider, credAlias.trim(), credApiKey.trim());
        if (res.success) {
            setCredAlias("");
            setCredApiKey("");
            await fetchData();
        } else {
            alert("Error saving credential: " + res.error);
        }
        setManagingCreds(false);
    };

    const handleDeleteCredential = async (id: number) => {
        if (!confirm("Delete this provider credential?")) return;
        setManagingCreds(true);
        const res = await deleteProviderCredential(id);
        if (res.success) {
            if (selectedCredId === String(id)) setSelectedCredId("");
            await fetchData();
        } else {
            alert("Error: " + res.error);
        }
        setManagingCreds(false);
    };

    const handleAddTemplate = async () => {
        if (!newTemplateName.trim()) return;
        setManagingTemplates(true);

        const activeProvider = selectedCredId
            ? credentials.find(c => c.id === Number(selectedCredId))?.provider
            : credProvider;

        const res = await addModelTemplate(newTemplateName.trim(), activeProvider || 'custom');
        if (res.success) {
            setNewTemplateName("");
            await fetchData();
        } else {
            alert("Error adding template: " + res.error);
        }
        setManagingTemplates(false);
    };

    const handleDeleteTemplate = async (id: number) => {
        setManagingTemplates(true);
        const res = await deleteModelTemplate(id);
        if (res.success) {
            setSelectedTemplateIds(prev => prev.filter(tid => tid !== id));
            await fetchData();
        } else {
            alert("Error: " + res.error);
        }
        setManagingTemplates(false);
    };

    const handleBulkCreate = async () => {
        if (!selectedCredId) {
            setCreateResult({ success: false, message: "Please select a saved Provider Credential." });
            return;
        }
        if (selectedTemplateIds.length === 0) {
            setCreateResult({ success: false, message: "Please select at least one template." });
            return;
        }

        setCreating(true);
        setCreateResult(null);

        const selectedNames = templates
            .filter(t => selectedTemplateIds.includes(t.id))
            .map(t => t.template_name);

        // Find which provider the selected cred belongs to, so we can tag the model properly
        const selectedCred = credentials.find(c => c.id === Number(selectedCredId));
        const providerName = selectedCred ? selectedCred.provider : credProvider;

        try {
            const res = await bulkCreateModels(
                Number(selectedCredId),
                selectedNames,
                providerName
            );

            if (res.success && res.results) {
                const successCount = res.results.filter((r: any) => r.status === "created").length;
                setCreateResult({ success: true, message: `Successfully created ${successCount} models.` });
                await fetchData();
            } else {
                setCreateResult({ success: false, message: "Error: " + (res.error || "Unknown error") });
            }
        } catch (e: any) {
            setCreateResult({ success: false, message: "Failed: " + e.message });
        } finally {
            setCreating(false);
        }
    };

    // Derived variables
    const activeProviderForTemplates = selectedCredId
        ? credentials.find(c => c.id === Number(selectedCredId))?.provider
        : credProvider;

    const currentProviderTemplates = templates.filter(t => t.provider === activeProviderForTemplates || t.provider === 'all');

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900">Upstream API Credentials</h1>
                <p className="text-gray-500 mt-2">
                    Manage your provider API keys and rapidly deploy multiple models via templates.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- LEFT COLUMN --- */}
                <div className="space-y-8">

                    {/* 1. Manage Provider Credentials */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                            <SaveIcon className="w-5 h-5 text-green-500" /> 1. Add Provider Key
                        </h2>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                                    <select
                                        value={credProvider}
                                        onChange={(e) => setCredProvider(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="gemini">Google (Gemini)</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="xai">xAI</option>
                                        <option value="azure">Azure OpenAI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Alias (e.g. &quot;Main OpenAI&quot;)</label>
                                    <input
                                        type="text"
                                        value={credAlias}
                                        onChange={(e) => setCredAlias(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Secret API Key</label>
                                <input
                                    type="password"
                                    value={credApiKey}
                                    onChange={(e) => setCredApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                            </div>
                            <button
                                onClick={handleSaveCredential}
                                disabled={managingCreds || !credAlias || !credApiKey}
                                className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {managingCreds ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Credential"}
                            </button>
                        </div>
                    </section>

                    {/* 2. Constructor */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                            <BookTemplate className="w-5 h-5 text-purple-500" /> 2. Mass Model Creation
                        </h2>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Saved Master Key
                                </label>
                                <select
                                    value={selectedCredId}
                                    onChange={(e) => {
                                        setSelectedCredId(e.target.value);
                                        setSelectedTemplateIds([]); // Reset templates on key change
                                    }}
                                    className="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                >
                                    <option value="">-- Choose a master key to unlock templates --</option>
                                    {credentials.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.provider.toUpperCase()} : {c.alias}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    Model Templates {activeProviderForTemplates && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs uppercase">{activeProviderForTemplates}</span>}
                                </p>

                                {/* Custom Template Adder */}
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder={`Add new ${activeProviderForTemplates || 'model'} template...`}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
                                        disabled={!selectedCredId && !credProvider}
                                    />
                                    <button
                                        onClick={handleAddTemplate}
                                        disabled={managingTemplates || !newTemplateName.trim()}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Template List */}
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 bg-gray-50/50 rounded-lg border border-gray-100 p-2">
                                    {!selectedCredId ? (
                                        <p className="text-sm text-gray-500 text-center py-4">Select a Master Key above to see templates.</p>
                                    ) : currentProviderTemplates.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">No templates found. Add one above.</p>
                                    ) : (
                                        currentProviderTemplates.map(t => (
                                            <div key={t.id} className="flex justify-between items-center p-2 border border-white bg-white rounded shadow-sm hover:border-blue-100 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTemplateIds.includes(t.id)}
                                                        onChange={() => setSelectedTemplateIds(prev =>
                                                            prev.includes(t.id) ? prev.filter(tid => tid !== t.id) : [...prev, t.id]
                                                        )}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="font-mono text-sm font-medium text-gray-800">{t.template_name}</span>
                                                </label>
                                                <button
                                                    onClick={() => handleDeleteTemplate(t.id)}
                                                    disabled={managingTemplates}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded"
                                                    title="Delete Template"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleBulkCreate}
                                disabled={creating || selectedTemplateIds.length === 0 || !selectedCredId}
                                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 mt-4"
                            >
                                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5" /> Deploy {selectedTemplateIds.length} Models</>}
                            </button>

                            {/* Results */}
                            {createResult && (
                                <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${createResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className={`flex items-start gap-2 ${createResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {createResult.success ? <Check className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                                        <p className="font-semibold text-sm">{createResult.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-8">

                    {/* Saved Credentials Viewer */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-gray-600" /> Saved Keys
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                            {loading && credentials.length === 0 ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400 mt-4" /> : credentials.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No provider keys saved yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {credentials.map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{c.alias}</p>
                                                <span className="text-xs uppercase font-bold text-gray-500 px-1.5 py-0.5 bg-gray-200 rounded">{c.provider}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCredential(c.id)}
                                                disabled={managingCreds}
                                                className="text-gray-400 hover:text-red-600 p-2 rounded transition-colors"
                                                title="Delete Key"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Active Proxy Models Viewer */}
                    <section>
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Active Proxy Models</h2>
                            <span className="text-sm font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                                Total: {models.length}
                            </span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-[440px] overflow-y-auto">
                            {models.length === 0 && !loading ? (
                                <div className="text-center py-10 text-gray-500 text-sm">No models configured yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {models.map(model => (
                                        <div key={model.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-200 transition-colors shadow-sm flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-mono text-sm font-bold text-gray-900">{model.id}</h3>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${model.litellm_provider === 'gemini' ? 'bg-blue-100 text-blue-700' :
                                                    model.litellm_provider === 'openai' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {model.litellm_provider || model.litellm_params?.custom_llm_provider || "unknown"}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono truncate bg-gray-50 p-1.5 rounded">
                                                Key: {model.litellm_params?.api_key ? `...${String(model.litellm_params.api_key).slice(-6)}` : "None"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}
