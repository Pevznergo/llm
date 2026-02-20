"use client";

import { useState, useEffect } from "react";
import { getModelCosts, saveModelCost, deleteModelCost } from "@/app/actions/admin";
import { Loader2, DollarSign, Plus, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

type ModelCost = {
    model_name: string;
    prompt_cost_per_1m: string | number;
    completion_cost_per_1m: string | number;
};

export default function ModelCostsClient() {
    const [loading, setLoading] = useState(true);
    const [costs, setCosts] = useState<ModelCost[]>([]);

    // Form state
    const [isSaving, setIsSaving] = useState(false);
    const [modelName, setModelName] = useState("");
    const [promptCost, setPromptCost] = useState("");
    const [completionCost, setCompletionCost] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getModelCosts();
            if (res.success) {
                setCosts(res.costs || []);
            } else {
                toast.error("Failed to load model costs");
            }
        } catch (e) {
            console.error("Error fetching costs:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modelName || !promptCost || !completionCost) {
            toast.error("All fields are required");
            return;
        }

        setIsSaving(true);
        try {
            const res = await saveModelCost(modelName, parseFloat(promptCost), parseFloat(completionCost));
            if (res.success) {
                toast.success("Model cost saved!");
                setModelName("");
                setPromptCost("");
                setCompletionCost("");
                fetchData();
            } else {
                toast.error(res.error || "Failed to save cost");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
        setIsSaving(false);
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete the pricing for ${name}?`)) return;

        try {
            const res = await deleteModelCost(name);
            if (res.success) {
                toast.success("Deleted successfully");
                fetchData();
            } else {
                toast.error(res.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleEdit = (cost: ModelCost) => {
        setModelName(cost.model_name);
        setPromptCost(cost.prompt_cost_per_1m.toString());
        setCompletionCost(cost.completion_cost_per_1m.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-600" /> Model Costs Management
                </h1>
                <p className="text-gray-500 mt-2">
                    Define the wholesale token pricing per model. These prices are used to calculate real USD spend on the Key Usage page.
                </p>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{costs.find(c => c.model_name === modelName) ? 'Update Existing Pricing' : 'Add New Pricing'}</h2>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model Name (Exact Match)</label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder="e.g. gemini-1.5-pro"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Cost / 1M</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.0001"
                                value={promptCost}
                                onChange={(e) => setPromptCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Completion Cost / 1M</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.0001"
                                value={completionCost}
                                onChange={(e) => setCompletionCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>
                    <div className="md:col-span-4 mt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {costs.find(c => c.model_name === modelName) ? 'Update Pricing' : 'Save Pricing'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Section */}
            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
            ) : costs.length === 0 ? (
                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-gray-500">No model costs defined yet. Add one above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Model Name</th>
                                    <th className="px-6 py-3">Prompt / 1M</th>
                                    <th className="px-6 py-3">Completion / 1M</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {costs.map((cost) => (
                                    <tr key={cost.model_name} className="hover:bg-green-50/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-gray-800">{cost.model_name}</td>
                                        <td className="px-6 py-4 text-gray-600">${Number(cost.prompt_cost_per_1m).toFixed(4)}</td>
                                        <td className="px-6 py-4 text-gray-600">${Number(cost.completion_cost_per_1m).toFixed(4)}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(cost)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-block"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cost.model_name)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors inline-block"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
