"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, TestTube2, Save, ChevronDown, ChevronUp, Loader2, PlugZap } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelConfig {
    api_key: string;        // per-model API key
    litellm_name: string;   // internal: e.g., "openai/gemini-2.5-pro"
    public_name: string;    // e.g., "gemini-2.5-pro"
    api_base: string;       // e.g., "https://generativelanguage.googleapis.com/v1beta/openai/"
    pricing_input: number;  // per 1M tokens, in USD
    pricing_output: number;
}

interface ModelGroup {
    id: number;
    name: string;
    proxy_url: string | null;
    gost_container_id: string | null;
    spend_limit: number;
    spend_today: number;
    models_config: ModelConfig[];
    litellm_model_ids: string[];
    status: "active" | "queued" | "exhausted";
    cooldown_until: string | null; // ISO timestamp
    created_at: string;
}

interface Template {
    id: number;
    template_name: string;
    litellm_name: string;
    public_name: string;
    api_base: string;
    pricing_input: number;
    pricing_output: number;
}

// ─── Default blank model config ───────────────────────────────────────────────

const blankModel = (): ModelConfig => ({
    api_key: "",
    litellm_name: "openai/gemini-2.5-pro",
    public_name: "gemini-2.5-pro",
    api_base: "https://generativelanguage.googleapis.com/v1beta/openai/",
    pricing_input: 0.00000125,
    pricing_output: 0.000010,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pct = (today: number, limit: number) => Math.min(100, (today / Math.max(limit, 0.01)) * 100).toFixed(0);

/** Format a cooldown timestamp into Moscow time (UTC+3) human-readable string */
function formatCooldown(iso: string): string {
    const d = new Date(iso);
    // UTC+3 = add 3*60 minutes
    const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    return msk.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' МСК';
}

/** Returns true if group is in cooldown */
const isOnCooldown = (g: ModelGroup) => !!g.cooldown_until && new Date(g.cooldown_until) > new Date();

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagePage() {
    const [groups, setGroups] = useState<ModelGroup[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [groupName, setGroupName] = useState("");
    const [proxyUrl, setProxyUrl] = useState("");
    const [spendLimit, setSpendLimit] = useState(300);
    const [modelList, setModelList] = useState<ModelConfig[]>([blankModel()]);
    const [saveTemplateName, setSaveTemplateName] = useState("");

    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        const [gr, tpl] = await Promise.all([
            fetch("/api/manage/models").then(r => r.json()),
            fetch("/api/manage/templates").then(r => r.json()),
        ]);
        setGroups(gr.models || []);
        setTemplates(tpl.templates || []);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => {
        setGroupName(""); setProxyUrl("");
        setSpendLimit(300); setModelList([blankModel()]); setSaveTemplateName("");
        setTestResult(null);
    };

    // ── Model list helpers ──────────────────────────────────────────────────────
    const addModel = () => setModelList(prev => [...prev, blankModel()]);
    const removeModel = (idx: number) => setModelList(prev => prev.filter((_, i) => i !== idx));
    const updateModel = (idx: number, field: keyof ModelConfig, val: string | number) =>
        setModelList(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
    const applyTemplate = (idx: number, tpl: Template) => {
        setModelList(prev => prev.map((m, i) => i === idx ? {
            api_key: m.api_key, // preserve the already-entered api key
            litellm_name: tpl.litellm_name,
            public_name: tpl.public_name,
            api_base: tpl.api_base,
            pricing_input: tpl.pricing_input,
            pricing_output: tpl.pricing_output,
        } : m));
    };

    // ── Save template ───────────────────────────────────────────────────────────
    const saveAsTemplate = async (model: ModelConfig, name: string) => {
        if (!name.trim()) return alert("Enter a template name first");
        const res = await fetch("/api/manage/templates", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template_name: name, ...model }),
        });
        const data = await res.json();
        if (res.ok) { alert("Template saved!"); load(); setSaveTemplateName(""); }
        else alert(data.error);
    };

    // ── Test connection (uses first model's api_key) ────────────────────────────
    const testConnection = async () => {
        const firstKey = modelList[0]?.api_key;
        if (!firstKey) return alert("Enter an API key for the first model first");
        setIsTesting(true); setTestResult(null);
        const res = await fetch("/api/manage/models/test", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: firstKey, proxy_url: proxyUrl || null }),
        });
        const data = await res.json();
        setTestResult({ ok: res.ok, msg: res.ok ? data.message : data.error });
        setIsTesting(false);
    };

    // ── Submit new group ────────────────────────────────────────────────────────
    const submitGroup = async () => {
        if (!groupName || modelList.length === 0 || modelList.some(m => !m.api_key || !m.litellm_name || !m.public_name))
            return alert("Fill in all required fields (each model needs an API key, litellm name, and public name)");
        setIsSubmitting(true);
        const res = await fetch("/api/manage/models", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: groupName, proxy_url: proxyUrl || null, spend_limit: spendLimit, models_config: modelList }),
        });
        const data = await res.json();
        if (res.ok) { setIsModalOpen(false); resetForm(); load(); }
        else alert(data.error);
        setIsSubmitting(false);
    };

    // ── Delete group ────────────────────────────────────────────────────────────
    const deleteGroup = async (id: number) => {
        if (!confirm("Remove this model group? All associated LiteLLM routes will be deleted.")) return;
        await fetch(`/api/manage/models/${id}`, { method: "DELETE" });
        load();
    };

    // ─── Rendered columns ──────────────────────────────────────────────────────
    const active = groups.filter(g => g.status === "active");
    const queued = groups.filter(g => g.status === "queued");
    const exhausted = groups.filter(g => g.status === "exhausted");

    const statusColors: Record<string, string> = {
        active: "bg-emerald-50 border-emerald-200 text-emerald-700",
        queued: "bg-blue-50 border-blue-200 text-blue-700",
        exhausted: "bg-gray-50 border-gray-200 text-gray-500",
    };

    // ─── Group card ────────────────────────────────────────────────────────────
    const GroupCard = ({ group }: { group: ModelGroup }) => {
        const expanded = expandedGroup === group.id;
        // Postgres returns DECIMAL as strings — coerce to numbers to avoid toFixed() TypeError
        const spendToday = Number(group.spend_today ?? 0);
        const spendLimit = Number(group.spend_limit ?? 300);
        const usedPct = parseFloat(pct(spendToday, spendLimit));
        const barColor = usedPct >= 90 ? "bg-red-500" : usedPct >= 60 ? "bg-amber-400" : "bg-emerald-500";
        const onCooldown = isOnCooldown(group);

        return (
            <div className={`border rounded-xl p-4 mb-3 transition-all ${onCooldown ? "bg-amber-50 border-amber-200 text-amber-800" : statusColors[group.status]}`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{group.name}</div>
                        <div className="text-xs opacity-70 mt-0.5">
                            {group.models_config?.length || 0} model{group.models_config?.length !== 1 ? "s" : ""} ·{" "}
                            <span className="font-mono">${spendToday.toFixed(2)} / ${spendLimit}</span>
                        </div>
                        {onCooldown && group.cooldown_until && (
                            <div className="mt-1 text-xs font-medium text-amber-700">
                                ⏳ Кулдаун до {formatCooldown(group.cooldown_until)}
                            </div>
                        )}
                        <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${usedPct}%` }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                        {group.gost_container_id && (
                            <span className="text-xs px-1.5 py-0.5 bg-black/10 rounded font-mono">Gost</span>
                        )}
                        <button onClick={() => setExpandedGroup(expanded ? null : group.id)} className="p-1 rounded hover:bg-black/10">
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button onClick={() => deleteGroup(group.id)} className="p-1 rounded hover:bg-red-100 text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className="mt-3 pt-3 border-t border-black/10 space-y-1">
                        {group.models_config?.map((m, i) => (
                            <div key={i} className="text-xs bg-white/70 rounded-lg px-3 py-2">
                                <div className="font-medium">{m.public_name}</div>
                                <div className="opacity-60 truncate">{m.api_base || "default"}</div>
                                <div className="opacity-60">${m.pricing_input?.toFixed(6)}/1k in · ${m.pricing_output?.toFixed(6)}/1k out</div>
                            </div>
                        ))}
                        {group.proxy_url && <div className="text-xs opacity-60 pt-1 truncate">🔗 {group.proxy_url}</div>}
                    </div>
                )}
            </div>
        );
    };

    // ─── Column wrapper ────────────────────────────────────────────────────────
    const Column = ({ title, items, badge, badgeColor }: { title: string; items: ModelGroup[]; badge?: string; badgeColor?: string }) => (
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h2>
                {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
            </div>
            {items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">Empty</div>
            ) : (
                items.map(g => <GroupCard key={g.id} group={g} />)
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">✈️ Airport Dispatcher</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage model key groups, proxy routing, and spend limits.</p>
                </div>
                <button
                    onClick={() => { setIsModalOpen(true); resetForm(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Key Group
                </button>
            </div>

            {/* Board */}
            {isLoading ? (
                <div className="flex items-center justify-center h-48 text-gray-400"><Loader2 className="animate-spin h-6 w-6" /></div>
            ) : (
                <div className="flex gap-6">
                    <Column title="Active" items={active} badge={`${active.length}/4`} badgeColor="bg-emerald-100 text-emerald-700" />
                    <Column title="Queued" items={queued} badge={queued.length > 0 ? String(queued.length) : undefined} badgeColor="bg-blue-100 text-blue-700" />
                    <Column title="Exhausted" items={exhausted} />
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold">Add Key Group</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* ── Group Info ── */}
                            <section>
                                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-3">Group Settings</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Group Name *</label>
                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                                            placeholder="DeepSeek Proxy Node 1" value={groupName} onChange={e => setGroupName(e.target.value)} />
                                    </div>



                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">SOCKS5 Proxy URL (optional)</label>
                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                                            placeholder="socks5h://user:pass@ip:port" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} />
                                        <p className="text-xs text-gray-400 mt-1">A Gost HTTP proxy container will be auto-spawned.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Spend Limit (USD)</label>
                                        <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                                            value={spendLimit} onChange={e => setSpendLimit(Number(e.target.value))} />
                                        <p className="text-xs text-gray-400 mt-1">Group rotates out when this limit is reached.</p>
                                    </div>
                                </div>

                                {/* Test Connection */}
                                <div className="mt-3 flex items-center gap-3">
                                    <button onClick={testConnection} disabled={isTesting || !modelList[0]?.api_key}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                        {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
                                        Test Connection
                                    </button>
                                    {testResult && (
                                        <span className={`text-xs font-medium ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}>
                                            {testResult.ok ? "✓" : "✕"} {testResult.msg}
                                        </span>
                                    )}
                                </div>
                            </section>

                            {/* ── Model List ── */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold uppercase text-gray-400">Models in this group ({modelList.length}/3)</h3>
                                    {modelList.length < 3 && (
                                        <button onClick={addModel} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                            <Plus className="h-3.5 w-3.5" /> Add Model
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {modelList.map((model, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                            {/* Template picker */}
                                            {templates.length > 0 && (
                                                <div className="mb-3">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Load from Template</label>
                                                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        defaultValue=""
                                                        onChange={e => {
                                                            const tpl = templates.find(t => String(t.id) === e.target.value);
                                                            if (tpl) applyTemplate(idx, tpl);
                                                        }}>
                                                        <option value="" disabled>— Select template —</option>
                                                        {templates.map(t => <option key={t.id} value={t.id}>{t.template_name}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Model fields */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">Provider API Key *</label>
                                                    <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        placeholder="sk-..." value={model.api_key}
                                                        onChange={e => updateModel(idx, "api_key", e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">Public Model Name *</label>
                                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        placeholder="gemini-2.5-pro" value={model.public_name}
                                                        onChange={e => updateModel(idx, "public_name", e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">LiteLLM Internal Name *</label>
                                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        placeholder="openai/gemini-2.5-pro" value={model.litellm_name}
                                                        onChange={e => updateModel(idx, "litellm_name", e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">API Base URL</label>
                                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                                                        value={model.api_base}
                                                        onChange={e => updateModel(idx, "api_base", e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Input price / 1M tokens ($)</label>
                                                    <input type="number" step="0.000001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        value={model.pricing_input}
                                                        onChange={e => updateModel(idx, "pricing_input", parseFloat(e.target.value) || 0)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Output price / 1M tokens ($)</label>
                                                    <input type="number" step="0.000001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                        value={model.pricing_output}
                                                        onChange={e => updateModel(idx, "pricing_output", parseFloat(e.target.value) || 0)} />
                                                </div>
                                            </div>

                                            {/* Save as template + Remove */}
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                                <input className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black/20"
                                                    placeholder="Template name…"
                                                    value={saveTemplateName}
                                                    onChange={e => setSaveTemplateName(e.target.value)} />
                                                <button onClick={() => saveAsTemplate(model, saveTemplateName)}
                                                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                                                    <Save className="h-3.5 w-3.5" /> Save
                                                </button>
                                                {modelList.length > 1 && (
                                                    <button onClick={() => removeModel(idx)}
                                                        className="text-xs px-2.5 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={submitGroup} disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Add to Queue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
