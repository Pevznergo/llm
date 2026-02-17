
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Search, LogOut, FileText, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

export default function DashboardSidebar() {
    const { data: session } = useSession();

    // Mock recent tasks
    const [recentTasks] = useState([
        { id: 1, title: 'SmartyMe Trial Refund', status: 'pending' },
        { id: 2, title: 'Gym Cancellation', status: 'completed' },
    ]);

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-100 flex flex-col z-40 hidden md:flex">
            {/* Logo Area */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 mb-8 group">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold group-hover:scale-95 transition-transform">
                        A
                    </div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">Aporto</span>
                </Link>

                <button className="w-full bg-[#007AFF] hover:bg-[#006ee6] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* Navigation / Recents */}
            <div className="flex-1 overflow-y-auto px-4">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent</span>
                </div>

                <div className="space-y-1">
                    {recentTasks.map((task) => (
                        <button key={task.id} className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 rounded-xl group transition-colors">
                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 truncate">{task.title}</span>
                        </button>
                    ))}
                    <button className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 rounded-xl group transition-colors">
                        <span className="w-4 h-4 flex items-center justify-center text-slate-400 border border-slate-300 rounded text-[10px]">+</span>
                        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600">View all tasks</span>
                    </button>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="User" className="w-9 h-9 rounded-full border border-slate-100" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {session?.user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
