import Link from 'next/link'
import { LayoutDashboard, Users, LogOut, Wallet } from 'lucide-react'
import { sql } from '@/lib/db'

export default async function AdminSidebar() {
    // Fetch pending notifications count
    const result = await sql`SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'`
    const pendingCount = parseInt(result[0].count || '0', 10)

    return (
        <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col fixed h-full z-20">
            <div className="p-6 pt-8">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Management
                </div>
                <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-900 group">
                    <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center text-white shadow-sm">
                        <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/admin/partners" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-900 group">
                    <div className="w-7 h-7 rounded-md bg-pink-500 flex items-center justify-center text-white shadow-sm">
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Partners & Tariffs</span>
                </Link>
                <Link href="/admin/payouts" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-900 group justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center text-white shadow-sm">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Payouts</span>
                    </div>
                    {pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {pendingCount}
                        </span>
                    )}
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Exit to App</span>
                </Link>
            </div>
        </aside>
    )
}
