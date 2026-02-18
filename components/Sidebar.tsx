"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    FileText,
    Key,
    Settings,
    LogOut,
    Menu
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Activity", href: "/", icon: Activity },
    { name: "Logs", href: "/logs", icon: FileText },
    { name: "API Keys", href: "/keys", icon: Key },
    { name: "Admin Keys", href: "/admin/keys", icon: Settings }, // Temporary admin link
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
