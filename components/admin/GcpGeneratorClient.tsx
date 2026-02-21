"use client";

import { useState } from "react";
import { Copy, Plus, Loader2, RotateCcw, MonitorPlay, Activity, CloudFog, Key } from "lucide-react";

export default function GcpGeneratorClient() {
    const [serviceAccountJson, setServiceAccountJson] = useState("");
    const [proxyUrl, setProxyUrl] = useState("");
    const [quantity, setQuantity] = useState(10);

    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<{ type: string, message: string, time: string }[]>([]);

    // Status tracking for progress bar
    const [progressCurrent, setProgressCurrent] = useState(0);
    const [progressTotal, setProgressTotal] = useState(0);

    const addLog = (type: string, message: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type, message, time }]);
    };

    const handleStartGeneration = async () => {
        if (!serviceAccountJson.trim()) {
            alert("Service Account JSON is required.");
            return;
        }

        try {
            JSON.parse(serviceAccountJson);
        } catch (e) {
            alert("Invalid JSON format for Service Account.");
            return;
        }

        setLoading(true);
        setLogs([]);
        setProgressCurrent(0);
        setProgressTotal(quantity);

        try {
            const response = await fetch('/api/gcp-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceAccountJson,
                    proxyUrl,
                    quantity
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                addLog('error', `HTTP Error ${response.status}: ${errText}`);
                setLoading(false);
                return;
            }

            if (!response.body) {
                addLog('error', 'Response body is null.');
                setLoading(false);
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Stream processing loop
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            addLog(data.type, data.message);

                            if (data.type === 'progress') {
                                setProgressCurrent(data.current);
                            }

                            if (data.type === 'done' || data.type === 'fatal') {
                                setLoading(false);
                            }
                        } catch (e) {
                            console.error("Failed to parse SSE line:", line);
                        }
                    }
                }
            }
        } catch (error: any) {
            addLog('error', `Network Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CloudFog className="w-8 h-8 text-blue-600" /> GCP Key Generator
                </h1>
                <p className="text-gray-500 mt-2">
                    Automate the creation of Google Cloud Projects, link billing, enable AI Studio APIs, and extract Gemini Keys.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-3">Automation Config</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Account JSON</label>
                        <textarea
                            value={serviceAccountJson}
                            onChange={(e) => setServiceAccountJson(e.target.value)}
                            placeholder='{"type": "service_account", "project_id": "...", ...}'
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs font-mono h-40"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500">Must have permissions to create projects and manage billing endpoints.</p>
                    </div>

                    <div className="space-y-4 sm:flex sm:space-y-0 sm:gap-4 flex-row">
                        <div className="space-y-2 flex-grow">
                            <label className="text-sm font-medium text-gray-700">HTTP/SOCKS Proxy (Optional)</label>
                            <input
                                type="text"
                                value={proxyUrl}
                                onChange={(e) => setProxyUrl(e.target.value)}
                                placeholder="socks5://user:pass@127.0.0.1:1080"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2 w-32 shrink-0">
                            <label className="text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            onClick={handleStartGeneration}
                            disabled={loading || !serviceAccountJson.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Orchestrating GCP APIs...
                                </>
                            ) : (
                                <>
                                    <MonitorPlay className="w-5 h-5" />
                                    Start Generation Sequence
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Live Console Output Panel */}
                <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 flex flex-col h-[500px] overflow-hidden">
                    <div className="bg-gray-950 px-4 py-3 flex justify-between items-center border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <Activity className={`w-4 h-4 ${loading ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Streaming Console</h2>
                        </div>
                        {progressTotal > 0 && (
                            <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                {progressCurrent} / {progressTotal} Projects
                            </span>
                        )}
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                                <Key className="w-8 h-8 opacity-20" />
                                <p>Awaiting execution...</p>
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="flex gap-3 px-1 hover:bg-gray-800/50 rounded py-0.5">
                                    <span className="text-gray-500 shrink-0">[{log.time}]</span>
                                    <span className={
                                        log.type === 'error' ? 'text-red-400' :
                                            log.type === 'success' ? 'text-green-400' :
                                                log.type === 'progress' ? 'text-yellow-300' :
                                                    log.type === 'done' ? 'text-blue-400 font-bold' :
                                                        'text-gray-300'
                                    }>
                                        {log.type === 'progress' ? '→ ' : ''}
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
