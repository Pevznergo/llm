"use client"

import { useState } from "react"
import { createApiKey } from "@/app/actions"
import { Loader2, Plus, Copy, Check } from "lucide-react"

export function KeyGenerator() {
    const [isLoading, setIsLoading] = useState(false)
    const [newKey, setNewKey] = useState<{ key: string, name: string } | null>(null)
    const [copied, setCopied] = useState(false)

    async function handleCreate(formData: FormData) {
        setIsLoading(true)
        const alias = formData.get("alias") as string
        const res = await createApiKey(alias)
        setIsLoading(false)

        if (res.success && res.key) {
            setNewKey({ key: res.key.key!, name: alias }) // Note: key.key is the sk-... value
        } else {
            alert("Error creating key: " + res.error)
        }
    }

    const copyToClipboard = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey.key)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Create New API Key</h3>

            {!newKey ? (
                <form action={handleCreate} className="flex gap-2">
                    <input
                        name="alias"
                        placeholder="Key Name (e.g. My App)"
                        className="flex-1 border p-2 rounded"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        Generate
                    </button>
                </form>
            ) : (
                <div className="bg-green-50 border border-green-200 p-4 rounded animate-in fade-in">
                    <p className="text-sm text-green-800 mb-2">Key created successfully! Copy it now, you won't see it again.</p>
                    <div className="flex items-center gap-2">
                        <code className="bg-white p-2 rounded border border-green-200 flex-1 font-mono text-sm overflow-hidden text-ellipsis">
                            {newKey.key}
                        </code>
                        <button
                            onClick={copyToClipboard}
                            className="p-2 hover:bg-green-100 rounded text-green-700"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                    <button
                        onClick={() => setNewKey(null)}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-900 underline"
                    >
                        Create another key
                    </button>
                </div>
            )}
        </div>
    )
}
