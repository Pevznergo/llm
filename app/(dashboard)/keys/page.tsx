import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listKeys } from "@/lib/litellm";
import { KeyGenerator } from "@/components/KeyGenerator";
import { DeleteKeyButton } from "@/components/DeleteKeyButton";
import { Copy, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default async function KeysPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) return redirect("/login");

    const email = session.user.email;
    const keys = await listKeys(email);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">API Keys</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Keys List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Key</th>
                                        <th className="px-6 py-3">Usage</th>
                                        <th className="px-6 py-3">Limit</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {keys.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No API keys found. Create one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        keys.map((key) => (
                                            <tr key={key.key} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {key.key_alias || "Unnamed Key"}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-600">
                                                    {key.key.startsWith("sk-")
                                                        ? `sk-...${key.key.slice(-4)}`
                                                        : `${key.key.substring(0, 3)}...${key.key.slice(-4)}`
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    ${key.spend?.toFixed(4) || "0.0000"}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {key.max_budget ? `$${key.max_budget.toFixed(2)}` : "Unlimited"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <DeleteKeyButton apiKey={key.key} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-800 text-sm mb-1">Using your keys</h3>
                            <p className="text-sm text-blue-700 mb-2">
                                Set your API key in your requests using the <code>Authorization</code> header:
                            </p>
                            <div className="bg-white p-2 rounded border border-blue-200 font-mono text-xs overflow-x-auto text-blue-800">
                                Authorization: Bearer sk-...
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Generate Key */}
                <div className="space-y-6">
                    <KeyGenerator />
                </div>
            </div>
        </div>
    );
}
