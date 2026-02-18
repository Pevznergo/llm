"use client";

import { useState } from "react";
import { Copy, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { deleteKeyAction } from "@/app/actions";

interface DeleteKeyButtonProps {
    apiKey: string;
}

export function DeleteKeyButton({ apiKey }: DeleteKeyButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await deleteKeyAction(apiKey);
            // Page will revalidate via server action
        } catch (error) {
            console.error("Failed to delete key", error);
            alert("Failed to delete key");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete Key"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
    );
}
