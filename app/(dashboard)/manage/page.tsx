'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, RefreshCw, Activity, Server, ZapOff, Check, X } from "lucide-react";

export default function DispatcherDashboard() {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Model Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);

    const [formData, setFormData] = useState({
        name: 'gemini-balance-nodes',
        api_key: '',
        proxy_url: '',
        daily_request_limit: 50,
    });

    const fetchModels = async () => {
        try {
            const res = await fetch('/api/manage/models');
            const data = await res.json();
            if (data.models) setModels(data.models);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
        const interval = setInterval(fetchModels, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTest = async () => {
        if (!formData.api_key || !formData.proxy_url) {
            alert("API Key and Proxy URL required for testing");
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/manage/models/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: formData.api_key,
                    proxy_url: formData.proxy_url
                })
            });
            const data = await res.json();
            if (res.ok) {
                setTestResult({ success: true, message: data.message });
            } else {
                setTestResult({ success: false, message: data.error });
            }
        } catch (e: any) {
            setTestResult({ success: false, message: e.message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.api_key || !formData.daily_request_limit) {
            alert("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/manage/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                alert("Model added to queue and Gost proxy initialized.");
                setIsModalOpen(false);
                setFormData({ name: 'gemini-balance-nodes', api_key: '', proxy_url: '', daily_request_limit: 50 });
                setTestResult(null);
                fetchModels();
            } else {
                alert("Failed to Add: " + data.error);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will kill the Gost Docker container and remove it from LiteLLM.")) return;
        try {
            const res = await fetch(`/api/manage/models/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchModels();
            } else {
                const data = await res.json();
                alert("Error: " + data.error);
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    const activeModels = models.filter(m => m.status === 'active');
    const queuedModels = models.filter(m => m.status === 'queued');
    const exhaustedModels = models.filter(m => m.status === 'exhausted');

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Airport Dispatcher</h1>
                    <p className="text-gray-500">Manage LiteLLM Proxy Gateways</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2 border p-4 rounded-lg bg-white shadow-sm">
                        <input type="checkbox" id="auto-mode" className="w-5 h-5 rounded" defaultChecked />
                        <label htmlFor="auto-mode" className="font-semibold text-lg cursor-pointer">Auto Dispatcher</label>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Model
                    </button>
                </div>
            </div>

            {/* CUSTOM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-[500px] shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Add AI Node to Dispatch Queue</h2>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">LiteLLM Node Group Name</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="gemini-balance-nodes"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">Models sharing this name will be load-balanced together.</p>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Provider API Key</label>
                                <input
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="sk-..."
                                    value={formData.api_key}
                                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">SOCKS5 Proxy URL (Optional)</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="socks5h://user:pass@ip:port"
                                    value={formData.proxy_url}
                                    onChange={(e) => setFormData({ ...formData, proxy_url: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">System will spawn a local Gost Docker container for this proxy.</p>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Daily Request Limit</label>
                                <input
                                    type="number"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.daily_request_limit}
                                    onChange={(e) => setFormData({ ...formData, daily_request_limit: Number(e.target.value) })}
                                />
                            </div>

                            {testResult && (
                                <div className={`p-3 rounded-md text-sm border flex items-center ${testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    {testResult.success ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                                    {testResult.message}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50"
                                onClick={handleTest}
                                disabled={isTesting || !formData.api_key}
                            >
                                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Test Connection
                            </button>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                                    onClick={handleCreate}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add to Queue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DASHBOARD COLUMNS */}
            <div className="grid lg:grid-cols-3 gap-6 items-start">

                {/* ACTIVE COLUMN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-green-600">
                            <Activity className="h-5 w-5" /> Active Now
                        </h2>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {activeModels.length} / 4
                        </span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {activeModels.map(model => (
                            <div key={model.id} className="rounded-lg border border-green-200 bg-green-50/10 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                                <div className="p-4 border-b border-green-100 flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">{model.name}</h3>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">#{model.id}</span>
                                </div>
                                <div className="p-4 space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Requests Today:</span>
                                        <span className="font-medium text-black">{model.requests_today} / {model.daily_request_limit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Gateway:</span>
                                        <span className="font-mono text-xs max-w-[150px] truncate" title={model.gost_container_id || 'Native'}>
                                            {model.gost_container_id || 'Native Route'}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(model.id)}
                                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm font-medium"
                                    >Kill</button>
                                </div>
                            </div>
                        ))}
                        {activeModels.length === 0 && !loading && (
                            <div className="text-center p-8 border border-dashed rounded-lg text-gray-400">
                                No active models. The dispatcher will pick from the queue.
                            </div>
                        )}
                    </div>
                </div>

                {/* QUEUED COLUMN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-600">
                            <Server className="h-5 w-5" /> Queued (Waitlist)
                        </h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {queuedModels.length} models
                        </span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {queuedModels.map(model => (
                            <div key={model.id} className="rounded-lg border border-blue-200 bg-white shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                <div className="p-4 border-b border-blue-100">
                                    <h3 className="font-semibold text-lg">{model.name}</h3>
                                </div>
                                <div className="p-4 space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Daily Limit:</span>
                                        <span className="font-medium text-black">{model.daily_request_limit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Gateway status:</span>
                                        {model.gost_container_id ? (
                                            <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Spawned</span>
                                        ) : (
                                            <span>Native Node</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2">
                                    <button
                                        onClick={() => handleDelete(model.id)}
                                        className="text-red-600 hover:bg-red-50 px-3 py-1 border border-red-200 rounded-md text-sm font-medium"
                                    >Discard</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EXHAUSTED COLUMN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
                            <ZapOff className="h-5 w-5" /> Exhausted
                        </h2>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {exhaustedModels.length}
                        </span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {exhaustedModels.map(model => (
                            <div key={model.id} className="rounded-lg border border-red-200 bg-red-50/50 shadow-sm relative overflow-hidden opacity-75 grayscale hover:grayscale-0 transition-all">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                                <div className="p-4 border-b border-red-100">
                                    <h3 className="font-semibold text-lg line-through text-gray-500">{model.name}</h3>
                                </div>
                                <div className="p-4 text-sm">
                                    <p className="text-red-800 font-medium">Daily limit reached ({model.daily_request_limit})</p>
                                </div>
                                <div className="bg-white px-4 py-3 flex justify-between">
                                    <span className="text-xs text-gray-400 my-auto">Sleeping</span>
                                    <button
                                        onClick={() => handleDelete(model.id)}
                                        className="text-red-600 hover:text-red-800 px-3 py-1 text-sm font-medium"
                                    >Clear</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
