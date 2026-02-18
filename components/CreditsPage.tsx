"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, FileText, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CreditsPageProps {
    balance: number;
}

export default function CreditsPageClient({ balance }: CreditsPageProps) {
    const [amount, setAmount] = useState<string>("10");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddCredits = () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;

        const message = encodeURIComponent(`Добрый день! Хочу пополнить баланс на ${value}`);
        window.open(`https://t.me/GoPevzner?text=${message}`, "_blank");
    };

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Credits</h1>
                <button
                    onClick={() => window.location.reload()}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Balance Card */}
            <div className="bg-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="text-4xl font-bold text-gray-900">
                    $ {balance.toFixed(2)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buy Credits Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-semibold text-lg">Buy Credits</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Use crypto</span>
                            <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-not-allowed">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-600 font-medium">Amount ($)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                            />
                        </div>

                        <button
                            onClick={handleAddCredits}
                            className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            Add Credits
                        </button>

                        <div className="space-y-2 pt-2">
                            <Link href="/" className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline">
                                View Usage <ExternalLink className="w-3 h-3" />
                            </Link>
                            <div className="text-sm text-gray-500">
                                Need Invoicing? <a href="mailto:sales@aporto.tech" className="text-blue-600 hover:underline">Contact Sales</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auto Top-Up Card (Placeholder) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-lg">Auto Top-Up</h2>
                        <button className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-900 cursor-not-allowed">
                            <SettingsIcon className="w-4 h-4" /> Enable
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Automatically purchase credits when your balance is below a certain threshold. You can select multiple payment methods that will be tried in order if payment fails.
                    </p>
                </div>
            </div>

            {/* Recent Transactions (Placeholder) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-700">Recent Transactions</h2>
                    <Link href="#" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
                        History <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Placeholder Row */}
                            {/* 
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-900">Feb 4, 2026 at 6:08 PM</td>
                                <td className="px-6 py-4 text-gray-900">$10</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-500 hover:text-gray-900 flex items-center gap-1 ml-auto">
                                        Get invoice <FileText className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                            */}
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                    No transactions found
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
                        <button disabled className="p-1 text-gray-300 cursor-not-allowed"><ArrowLeft className="w-4 h-4" /></button>
                        <button disabled className="p-1 text-gray-300 cursor-not-allowed"><ArrowRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
