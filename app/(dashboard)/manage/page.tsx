"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Plus, Play, Pause, Trash2, Archive, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export default function ManageDashboard() {
    const [models, setModels] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formMode, setFormMode] = useState<'template' | 'json'>('template');

    // Shared state
    const [account, setAccount] = useState("");

    // Form state for Template
    const [templateData, setTemplateData] = useState({
        model_name: "",
        api_key: "",
        proxy_url: "",
        max_requests_per_day: 100
    });

    // Form state for JSON
    const [jsonData, setJsonData] = useState("");
    const [jsonDailyLimit, setJsonDailyLimit] = useState(100);

    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<boolean | null>(null);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const res = await axios.get("/api/manage/models");
            if (res.data.success) {
                setModels(res.data.models);
            }
        } catch (e) {
            toast.error("Failed to load models");
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setTestLoading(true);
        setTestResult(null);
        try {
            let params: any = {};
            if (formMode === 'template') {
                params = {
                    api_key: templateData.api_key,
                    proxy_url: templateData.proxy_url,
                    model: "openai/" + templateData.model_name
                };
            } else {
                try {
                    const parsed = JSON.parse(jsonData);
                    params = parsed.litellm_params;
                } catch (e) {
                    toast.error("Invalid JSON format");
                    setTestLoading(false);
                    return;
                }
            }

            const res = await axios.post("/api/manage/models/test", { litellm_params: params });
            if (res.data.success) {
                setTestResult(true);
                toast.success("Connection successful!");
            } else {
                setTestResult(false);
                toast.error("Test failed: " + res.data.error);
            }
        } catch (e: any) {
            setTestResult(false);
            toast.error("Test failed: " + (e.response?.data?.error || e.message));
        } finally {
            setTestLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            let payload: any = {};
            if (formMode === 'template') {
                if (!templateData.model_name || !templateData.api_key) {
                    toast.error("Please fill required fields");
                    return;
                }
                payload = {
                    account: account || undefined,
                    model_name: templateData.model_name,
                    daily_request_limit: Number(templateData.max_requests_per_day),
                    litellm_params: {
                        model: "openai/" + templateData.model_name,
                        api_key: templateData.api_key,
                        proxy_url: templateData.proxy_url || undefined,
                        custom_llm_provider: "openai"
                    },
                    model_info: {
                        db_model: true
                    }
                };
            } else {
                const parsed = JSON.parse(jsonData);
                payload = {
                    account: account || parsed.account || undefined,
                    model_name: parsed.model_name,
                    daily_request_limit: Number(jsonDailyLimit),
                    litellm_params: parsed.litellm_params,
                    model_info: parsed.model_info || { db_model: true }
                };
                if (!payload.model_name || !payload.litellm_params) {
                    toast.error("JSON must include model_name and litellm_params");
                    return;
                }
            }

            const res = await axios.post("/api/manage/models", payload);
            if (res.data.success) {
                toast.success("Model added to queue");
                setIsAddModalOpen(false);
                setAccount("");
                setTemplateData({ model_name: "", api_key: "", proxy_url: "", max_requests_per_day: 100 });
                setJsonData("");
                setTestResult(null);
                fetchModels();
            } else {
                toast.error(res.data.error || "Failed to add model");
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || e.message || "Invalid input");
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await axios.patch(`/api/manage/models/${id}`, { status });
            toast.success(`Model moved to ${status}`);
            fetchModels();
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to permanently delete this model?")) return;
        try {
            await axios.delete(`/api/manage/models/${id}`);
            toast.success("Model deleted");
            fetchModels();
        } catch (e) {
            toast.error("Failed to delete model");
        }
    };

    const activeModels = models.filter(m => m.status === 'active');
    const queuedModels = models.filter(m => m.status === 'queued');
    const exhaustedModels = models.filter(m => m.status === 'exhausted');
    const archivedModels = models.filter(m => m.status === 'archived');

    const ModelCard = ({ model }: { model: any }) => (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 shadow flex flex-col gap-2 relative transition-all duration-300 hover:border-blue-500">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <div className="flex flex-col">
                    <h3 className="text-lg font-mono text-yellow-500 font-bold">{model.model_name.toUpperCase()}</h3>
                    {model.account && <span className="text-xs text-slate-400 mt-1">📧 {model.account}</span>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${model.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    model.status === 'queued' ? 'bg-blue-500/20 text-blue-400' :
                        model.status === 'exhausted' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-slate-500/20 text-slate-400'
                    }`}>
                    {model.status.toUpperCase()}
                </span>
            </div>
            <div className="text-sm text-slate-300 font-mono mt-2">
                LIMIT: {model.requests_today} / {model.daily_request_limit} Reqs
            </div>

            <div className="mt-4 flex gap-2 justify-end absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
                {model.status !== 'archived' && (
                    <button onClick={() => handleStatusChange(model.id, 'archived')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300" title="Archive">
                        <Archive size={16} />
                    </button>
                )}
                {model.status === 'archived' && (
                    <button onClick={() => handleStatusChange(model.id, 'queued')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300" title="Restore to Queue">
                        <RefreshCw size={16} />
                    </button>
                )}
                <button onClick={() => handleDelete(model.id)} className="p-2 bg-red-900/50 hover:bg-red-800 rounded text-red-400" title="Delete Permanently">
                    <Trash2 size={16} />
                </button>
            </div>
        </div >
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <span className="text-blue-500">✈</span> MODEL DISPATCH
                        </h1>
                        <p className="text-slate-400 mt-1">Flight Control for AI Models. Max 4 Active.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} /> ADD MODEL
                    </button>
                </div>

                {loading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-2 bg-slate-700 rounded w-1/4"></div>
                            <div className="h-32 bg-slate-800 rounded"></div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* ACTIVE Column */}
                        <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <h2 className="text-xl font-bold flex items-center justify-between text-green-400">
                                <span>ACTIVE LIST</span>
                                <span className="text-sm bg-green-900/50 px-2 py-1 rounded">{activeModels.length}/4</span>
                            </h2>
                            <div className="flex flex-col gap-3 min-h-[500px]">
                                {activeModels.map(m => <ModelCard key={m.id} model={m} />)}
                                {activeModels.length === 0 && <div className="text-slate-600 flex-1 flex items-center justify-center font-mono">NO ACTIVE MODELS</div>}
                            </div>
                        </div>

                        {/* QUEUED Column */}
                        <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <h2 className="text-xl font-bold flex items-center justify-between text-blue-400">
                                <span>ON QUEUE</span>
                                <span className="text-sm bg-blue-900/50 px-2 py-1 rounded">{queuedModels.length}</span>
                            </h2>
                            <div className="flex flex-col gap-3 min-h-[500px]">
                                {queuedModels.map(m => <ModelCard key={m.id} model={m} />)}
                                {queuedModels.length === 0 && <div className="text-slate-600 flex-1 flex items-center justify-center font-mono">QUEUE EMPTY</div>}
                            </div>
                        </div>

                        {/* EXHAUSTED Column */}
                        <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <h2 className="text-xl font-bold flex items-center justify-between text-orange-400">
                                <span>EXHAUSTED</span>
                                <span className="text-sm bg-orange-900/50 px-2 py-1 rounded">{exhaustedModels.length}</span>
                            </h2>
                            <div className="flex flex-col gap-3 min-h-[500px]">
                                {exhaustedModels.map(m => <ModelCard key={m.id} model={m} />)}
                            </div>
                        </div>

                        {/* ARCHIVED Column */}
                        <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <h2 className="text-xl font-bold flex items-center justify-between text-slate-500">
                                <span>ARCHIVE</span>
                                <span className="text-sm bg-slate-800 px-2 py-1 rounded">{archivedModels.length}</span>
                            </h2>
                            <div className="flex flex-col gap-3 min-h-[500px]">
                                {archivedModels.map(m => <ModelCard key={m.id} model={m} />)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD MODEL MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Add New Model</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="flex p-4 gap-4 bg-slate-900 border-b border-slate-800">
                            <button
                                className={`px-4 py-2 rounded font-medium transition-colors ${formMode === 'template' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                                onClick={() => setFormMode('template')}
                            >
                                Easy Template
                            </button>
                            <button
                                className={`px-4 py-2 rounded font-medium transition-colors ${formMode === 'json' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                                onClick={() => setFormMode('json')}
                            >
                                Advanced JSON
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">

                            {/* Shared Account Field */}
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 font-bold tracking-wide">ACCOUNT (Email)</label>
                                <input
                                    list="accounts-list"
                                    value={account}
                                    onChange={e => setAccount(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="example@email.com"
                                />
                                <datalist id="accounts-list">
                                    {Array.from(new Set(models.map(m => m.account).filter(Boolean))).map((acc: any) => (
                                        <option key={acc} value={acc} />
                                    ))}
                                </datalist>
                            </div>

                            <hr className="border-slate-800" />

                            {formMode === 'template' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400 font-bold tracking-wide">MODEL NAME (e.g. gpt-4)</label>
                                            <input
                                                value={templateData.model_name}
                                                onChange={e => setTemplateData({ ...templateData, model_name: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:outline-none placeholder-slate-600"
                                                placeholder="Model name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400 font-bold tracking-wide">DAILY LIMIT (Requests)</label>
                                            <input
                                                type="number"
                                                value={templateData.max_requests_per_day}
                                                onChange={e => setTemplateData({ ...templateData, max_requests_per_day: Number(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 font-bold tracking-wide">API KEY</label>
                                        <input
                                            type="password"
                                            value={templateData.api_key}
                                            onChange={e => setTemplateData({ ...templateData, api_key: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                            placeholder="sk-..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 font-bold tracking-wide">PROXY URL (Base API URL)</label>
                                        <input
                                            value={templateData.proxy_url}
                                            onChange={e => setTemplateData({ ...templateData, proxy_url: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                            placeholder="https://...."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 font-bold tracking-wide">DAILY LIMIT (Requests)</label>
                                        <input
                                            type="number"
                                            value={jsonDailyLimit}
                                            onChange={e => setJsonDailyLimit(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 font-bold tracking-wide">LITELLM CONFIG JSON</label>
                                        <textarea
                                            value={jsonData}
                                            onChange={e => setJsonData(e.target.value)}
                                            rows={12}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder={`{\n  "model_name": "gpt-4",\n  "litellm_params": {\n    "api_key": "sk-...",\n    ...\n  }\n}`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Test Results Area */}
                            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <button
                                    onClick={handleTest}
                                    disabled={testLoading}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
                                >
                                    {testLoading ? 'Testing...' : 'Test Connection'}
                                </button>
                                {testResult === true && <span className="text-green-500 flex items-center gap-2"><CheckCircle size={16} /> Success</span>}
                                {testResult === false && <span className="text-red-500 flex items-center gap-2"><XCircle size={16} /> Failed</span>}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-6 py-2 rounded font-medium text-slate-300 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded font-bold shadow-lg"
                            >
                                Adds to Queue
                            </button>
                        </div>
                    </div>
                </div >
            )
            }
        </div >
    );
}
