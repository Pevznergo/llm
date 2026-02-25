"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    FileText,
    Key,
    Settings,
    LogOut,
    Menu,
    CreditCard,
    Box,
    CloudFog
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Activity", href: "/", icon: Activity },
    { name: "Logs", href: "/logs", icon: FileText },
    { name: "Models", href: "/models", icon: Box },
    { name: "API Keys", href: "/keys", icon: Key },
    { name: "Documentation", href: "/docs", icon: FileText },
    { name: "Credits", href: "/credits", icon: CreditCard },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Warning: Client-side session check for UI only. Server updates must verify email.
    // Ideally we pass user from layout, but for now we rely on hiding it via simple logic or user just knowing the link.
    // However, user asked for "Admin" with access only for specific email.
    // We can't easily check email in Sidebar client component without useSession (which needs SessionProvider).
    // Let's assume for now we list it but page is protected, OR we can try to useSession().

    // For simplicity in this step, I'll add the link which is visible to everyone (or use a hardcoded check if I had session).
    // But since I don't want to break "use client" with session provider dependency if not there...
    // I will add it to the list, but maybe obscure it? 
    // Actually, user said "only accessible to...", implies visibility too.
    // Let's rely on server protection for security, but for UI let's add it.

    const adminNavigation = [
        ...navigation,
        { name: "Admin Users", href: "/admin/users", icon: Settings }, // Reusing Settings icon for Admin
        { name: "Add Credentials", href: "/admin/add-credentials", icon: Key }, // New link
    ];

    // NOTE: In a real app, useSession() here to optionally render.
    // For now, I'll render it at the bottom distinctively.

    const isAdmin = ["pevznergo@gmail.com", "igordash1@gmail.com"].includes(session?.user?.email || "");

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-black rounded-lg"></div>
                    <span className="font-semibold text-lg">Client Portal</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu className="h-6 w-6 text-gray-600" />
                </button>
            </div>

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                "flex flex-col h-full"
            )}>
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="font-semibold text-xl">Aporto.tech</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-gray-100 text-black"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-black" : "text-gray-400")} />
                                {item.name}
                            </Link>
                        );
                    })}

                    {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-1">
                            <Link
                                href="/admin/users"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-purple-600 hover:bg-purple-50",
                                    pathname === "/admin/users" ? "bg-purple-50" : ""
                                )}
                            >
                                <Settings className="h-5 w-5" />
                                Admin Users
                            </Link>
                            <Link
                                href="/admin/add-credentials"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-blue-600 hover:bg-blue-50",
                                    pathname === "/admin/add-credentials" ? "bg-blue-50" : ""
                                )}
                            >
                                <Key className="h-5 w-5" />
                                Add Credentials
                            </Link>
                            <Link
                                href="/admin/key-usage"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-emerald-600 hover:bg-emerald-50",
                                    pathname === "/admin/key-usage" ? "bg-emerald-50" : ""
                                )}
                            >
                                <Activity className="h-5 w-5" />
                                Key Usage Stats
                            </Link>
                            <Link
                                href="/admin/model-limits"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-orange-600 hover:bg-orange-50",
                                    pathname === "/admin/model-limits" ? "bg-orange-50" : ""
                                )}
                            >
                                <Activity className="h-5 w-5" />
                                Daily Model Limits
                            </Link>
                            <Link
                                href="/admin/gcp-generator"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-indigo-600 hover:bg-indigo-50",
                                    pathname === "/admin/gcp-generator" ? "bg-indigo-50" : ""
                                )}
                            >
                                <CloudFog className="h-5 w-5" />
                                GCP API Factory
                            </Link>
                            <Link
                                href="/manage"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-pink-600 hover:bg-pink-50",
                                    pathname === "/manage" ? "bg-pink-50" : ""
                                )}
                            >
                                <Activity className="h-5 w-5" />
                                Airport Dispatcher
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Footer / User */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-0 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
