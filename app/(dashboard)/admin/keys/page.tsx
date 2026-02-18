import { getAllKeysWithDetails, assignKeyToUser } from "@/app/actions/admin";
import { format } from "date-fns";
import { AssignKeyForm } from "@/components/AssignKeyForm";

export default async function AdminKeysPage() {
    const keys = await getAllKeysWithDetails();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Admin: All API Keys</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Alias</th>
                                <th className="px-6 py-3">Key (Hash)</th>
                                <th className="px-6 py-3">Assigned To</th>
                                <th className="px-6 py-3">Spend</th>
                                <th className="px-6 py-3">Limit</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {keys.map((key: any) => (
                                <tr key={key.key || key.token} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {key.key_alias || "-"}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        {(key.key || "").substring(0, 16)}...
                                    </td>
                                    <td className="px-6 py-4">
                                        {key.user_id ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                {key.user_id}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        ${(key.spend || 0).toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {key.max_budget ? `$${key.max_budget}` : "∞"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <AssignKeyForm apiKey={key.key} currentUserId={key.user_id} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
