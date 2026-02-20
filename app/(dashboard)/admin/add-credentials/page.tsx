"use client";

import { useState, useEffect } from "react";
import { adminGetAllKeys, adminGenerateKey, adminDeleteKey, adminUpdateKey } from "@/app/actions/admin";
import { LiteLLMKey } from "@/lib/litellm";
import { Loader2, Key, Check, AlertCircle, Copy, ArrowRight, Trash2, Edit2, X, Save } from "lucide-react";

export default function AddCredentialsPage() {
    // Generate Key State
    const [alias, setAlias] = useState("");
    const [budget, setBudget] = useState<number | "">("");
    const [email, setEmail] = useState("");

    // Existing Keys State
    const [keys, setKeys] = useState<LiteLLMKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [managingKeys, setManagingKeys] = useState(false);

    // Edit State
    const [editingKeyHash, setEditingKeyHash] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        alias: "",
        budget: "" as number | ""
    });

    const [createResult, setCreateResult] = useState<{ success: boolean, message: string, key?: string } | null>(null);

    const fetchKeys = async () => {
        setLoading(true);
        const res = await adminGetAllKeys();
        if (res.success) {
            setKeys(res.keys || []);
        } else {
            console.error("Failed to fetch keys:", res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        setCreateResult(null);

        try {
            const numBudget = typeof budget === 'number' ? budget : (budget ? parseFloat(budget as string) : undefined);

            const res = await adminGenerateKey(
                email.trim() || "pevznergo@gmail.com",
                numBudget,
                alias.trim() || undefined
            );

            if (res.success && res.key) {
                setCreateResult({ success: true, message: "Key created successfully!", key: res.key });
                setAlias("");
                setBudget("");
                setEmail("");
                await fetchKeys();
            } else {
                setCreateResult({ success: false, message: "Error: " + res.error });
            }
        } catch (e: any) {
            setCreateResult({ success: false, message: "Failed: " + e.message });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (keyHash: string) => {
        if (!confirm(`Are you sure you want to delete this key?`)) return;

        setManagingKeys(true);
        try {
            const res = await adminDeleteKey(keyHash);
            if (res.success) {
                setKeys(keys.filter(k => (k.token !== keyHash && k.key !== keyHash)));
            } else {
                alert("Failed to delete key: " + res.error);
            }
        } catch (e: any) {
            alert("Error deleting key: " + e.message);
        } finally {
            setManagingKeys(false);
        }
    };

    const startEdit = (k: LiteLLMKey) => {
        setEditingKeyHash(k.token || k.key);
        setEditForm({
            alias: k.key_alias || "",
            budget: k.max_budget || ""
        });
    };

    const cancelEdit = () => {
        setEditingKeyHash(null);
        setEditForm({ alias: "", budget: "" });
    };

    const handleUpdate = async (keyHash: string) => {
        setManagingKeys(true);
        try {
            const numBudget = typeof editForm.budget === 'number' ? editForm.budget : (editForm.budget ? parseFloat(editForm.budget as string) : null);

            const updates: any = {};
            if (editForm.alias !== undefined) updates.key_alias = editForm.alias;
            if (numBudget !== null) updates.max_budget = numBudget;

            const res = await adminUpdateKey(keyHash, updates);
            if (res.success) {
                await fetchKeys();
                setEditingKeyHash(null);
            } else {
                alert("Failed to update key: " + res.error);
            }
        } catch (e: any) {
            alert("Error updating key: " + e.message);
        } finally {
            setManagingKeys(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="border-b border-gray-200 pb-5 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage API Credentials</h1>
                    <p className="text-gray-500 mt-2">
                        Generate and manage LiteLLM access keys for your proxy.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Form (1/3 width) */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Generate New Key</h2>

                    <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alias (Optional)
                            </label>
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                placeholder="e.g. production-key-1"
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Budget (Optional, USD)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : "")}
                                placeholder="e.g. 10.00"
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign to Email (Optional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Default: admin"
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="w-full mt-4 py-2.5 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Key className="w-4 h-4" /> Generate Key
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results block */}
                    {createResult && (
                        <div className={`p-4 rounded-xl border ${createResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className={`flex items-start gap-2 ${createResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {createResult.success ? <Check className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                                <div>
                                    <p className="font-semibold text-sm">{createResult.message}</p>
                                    {createResult.key && (
                                        <div className="mt-2 bg-white/60 p-2 rounded border border-green-200/50 flex flex-col gap-2">
                                            <p className="text-xs font-mono break-all font-bold select-all">{createResult.key}</p>
                                            <button
                                                onClick={() => copyToClipboard(createResult.key!)}
                                                className="text-xs bg-green-100 px-2 py-1 rounded w-fit hover:bg-green-200 transition-colors flex items-center gap-1"
                                            >
                                                <Copy className="w-3 h-3" /> Copy Key
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Existing Keys (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[800px]">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Active API Keys</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                                Total: {keys.length}
                            </span>
                            {loading && !managingKeys && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {keys.length === 0 && !loading ? (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No API keys found.
                            </div>
                        ) : (
                            keys.map((k, index) => {
                                const hash = k.token || k.key; // Litellm mostly returns token hash

                                return (
                                    <div key={hash || index} className="border border-gray-100 rounded-lg p-4 hover:border-blue-100 transition-colors bg-white shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                    {k.key_alias || "unnamed_key"}
                                                </h3>
                                            </div>
                                            <p className="font-mono text-xs text-gray-500 break-all">
                                                {hash.length > 20 ? `${hash.substring(0, 20)}...` : hash}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                                <div>
                                                    <span className="text-gray-400">Spend:</span> ${k.spend !== undefined ? k.spend.toFixed(4) : "0.0000"}
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Budget:</span> {k.max_budget ? `$${k.max_budget}` : "Unlimited"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:items-end gap-3 min-w-[250px]">
                                            <div className="flex gap-2">
                                                {editingKeyHash !== hash && (
                                                    <button
                                                        onClick={() => startEdit(k)}
                                                        disabled={managingKeys}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                        title="Edit limits/alias"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => copyToClipboard(hash)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                    title="Copy key hash"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(hash)}
                                                    disabled={managingKeys || editingKeyHash === hash}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    title="Delete key"
                                                >
                                                    {managingKeys && !editingKeyHash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            {/* Edit Form */}
                                            {editingKeyHash === hash && (
                                                <div className="w-full space-y-2 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-gray-500 uppercase">Alias</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.alias}
                                                            onChange={e => setEditForm({ ...editForm, alias: e.target.value })}
                                                            placeholder="Name"
                                                            className="w-full text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-gray-500 uppercase">Budget (USD)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editForm.budget}
                                                            onChange={e => setEditForm({ ...editForm, budget: e.target.value ? Number(e.target.value) : "" })}
                                                            placeholder="Unlimited if empty"
                                                            className="w-full text-xs p-1.5 border rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end pt-1">
                                                        <button
                                                            onClick={cancelEdit}
                                                            disabled={managingKeys}
                                                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdate(hash)}
                                                            disabled={managingKeys}
                                                            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-1"
                                                        >
                                                            {managingKeys && editingKeyHash === hash ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

