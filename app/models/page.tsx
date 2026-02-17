import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels, listKeys } from "@/lib/litellm";
import { CopyButton, IntegrationSnippet } from "@/components/ModelComponents";
import Link from 'next/link';
import { SignOutButton } from "@/components/SignOutButton";
import { LogOut, ArrowLeft } from "lucide-react";

export default async function ModelsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) return redirect("/api/auth/signin");

    const email = session.user.email;
    const models = await getModels();
    const keys = await listKeys(email);

    // Use the first active key for snippets, or a placeholder
    const activeKey = keys.find(k => k.key) || keys[0];
    const apiKeyPlaceholder = activeKey ? (activeKey.key || `sk-...`) : "YOUR_API_KEY";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <span className="font-semibold text-lg">Available Models</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{email}</span>
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="font-medium">Models List</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snippets</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {models.map((model) => (
                                    <tr key={model.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {model.id} {/* LiteLLM often uses ID as name, or check object specifics */}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                            <code className="bg-gray-100 px-2 py-1 rounded">{model.id}</code>
                                            <CopyButton text={model.id} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {model.owned_by || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <details className="group">
                                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 list-none">
                                                    Show Integration
                                                </summary>
                                                <div className="fixed inset-0 bg-black/50 z-50 hidden group-open:flex items-center justify-center p-4"
                                                    onClick={(e) => {
                                                        // hacky modal, but works without extra state
                                                        const target = e.target as HTMLElement;
                                                        if (target === e.currentTarget) {
                                                            target.closest('details')?.removeAttribute('open');
                                                        }
                                                    }}
                                                >
                                                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                                                        <button
                                                            className="absolute top-4 right-4 text-gray-500 hover:text-black"
                                                            onClick={(e) => {
                                                                e.currentTarget.closest('details')?.removeAttribute('open');
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                        <h3 className="text-lg font-bold mb-2">Connect to {model.id}</h3>
                                                        <p className="text-sm text-gray-500 mb-4">Use your API key to interact with this model.</p>
                                                        <IntegrationSnippet modelId={model.id} apiKey={apiKeyPlaceholder} />
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
