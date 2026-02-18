"use client";

import { useState } from "react";
import { assignKeyToUser } from "@/app/actions/admin";
import { Check, Loader2, X } from "lucide-react";

interface AssignKeyFormProps {
    apiKey: string;
    currentUserId?: string;
}

export function AssignKeyForm({ apiKey, currentUserId }: AssignKeyFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState(currentUserId || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await assignKeyToUser(apiKey, email);
            setSuccess(true);
            setIsEditing(false);
            // Optional: refresh page data
            window.location.reload();
        } catch (error) {
            console.error("Failed to assign key", error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return <span className="text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Updated</span>;
    }

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
                Edit User
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@email.com"
                className="px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 w-40"
                required
            />
            <button
                type="submit"
                disabled={loading}
                className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </button>
            <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
            >
                <X className="h-3 w-3" />
            </button>
        </form>
    );
}
