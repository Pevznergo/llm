"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut()}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            title="Sign Out"
        >
            <LogOut className="h-5 w-5" />
        </button>
    );
}
