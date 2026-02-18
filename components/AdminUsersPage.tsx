"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserFunds } from "@/app/actions/admin";
import { RefreshCw, Plus, Minus, Edit2, Loader2, Search } from "lucide-react";

interface AdminUsersPageProps {
    users: any[];
}

export default function AdminUsersPageClient({ users }: AdminUsersPageProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState<string>("10");
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [operation, setOperation] = useState<"add" | "set" | "subtract">("add");

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (user: any, op: "add" | "set" | "subtract") => {
        setSelectedUser(user);
        setOperation(op);
        setAmount(op === "set" ? (user.max_budget || 0).toString() : "10");
        setModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setIsUpdating(true);
        try {
            const val = parseFloat(amount);
            if (isNaN(val) || val < 0) return;

            await updateUserFunds(selectedUser.email, val, operation);
            setModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={() => router.refresh()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">User / Email</th>
                            <th className="px-6 py-3 font-medium">Total Spend</th>
                            <th className="px-6 py-3 font-medium">Max Budget</th>
                            <th className="px-6 py-3 font-medium">Balance</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => {
                            const balance = Math.max(0, (user.max_budget || 0) - (user.spend || 0));
                            return (
                                <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 text-gray-600">${(user.spend || 0).toFixed(4)}</td>
                                    <td className="px-6 py-4 text-gray-600">${(user.max_budget || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${balance > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                            }`}>
                                            ${balance.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(user, "add")}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                                                title="Add Funds"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(user, "set")}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                                title="Set Budget"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Fund Modal */}
            {modalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
                        <h2 className="text-xl font-bold mb-4">
                            {operation === "add" ? "Add Funds" : operation === "subtract" ? "Deduct Funds" : "Set Budget"}
                        </h2>
                        <p className="text-gray-600 text-sm mb-6">
                            Running update for <strong>{selectedUser.email}</strong>.
                            Current Budget: ${(selectedUser.max_budget || 0).toFixed(2)}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {operation === "add" ? "Add Funds" : operation === "subtract" ? "Deduct" : "Set Budget"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
