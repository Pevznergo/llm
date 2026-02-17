"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createApiKey } from "@/app/actions";
import { Plus, Loader2 } from "lucide-react";

type FormData = {
    alias: string;
    budget?: number;
};

export function KeyGenerator() {
    const { register, handleSubmit, reset } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        setNewKey(null);

        try {
            const result = await createApiKey(data.alias, data.budget);
            if (result.success && result.key) {
                setNewKey(result.key);
                reset();
            } else {
                setError(result.error || "Failed to generate key");
            }
        } catch (e) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium mb-4">Generate New Key</h3>

            {newKey && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium mb-1">Key Generated Successfully!</p>
                    <p className="font-mono text-sm bg-white p-2 border rounded border-green-100 select-all break-all">{newKey}</p>
                    <p className="text-xs text-green-600 mt-2">Make sure to copy this key now, you won&apos;t be able to see it again.</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Alias</label>
                    <input
                        {...register("alias", { required: true })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. Development Key"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget (Optional)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            {...register("budget", { valueAsNumber: true })}
                            type="number"
                            step="0.01"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="10.00"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                >
                    {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                        <><Plus className="h-4 w-4" /> Generate Key</>
                    )}
                </button>
            </form>
        </div>
    );
}
