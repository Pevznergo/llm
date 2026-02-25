import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ success: false, error: "Missing token or password" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // Find user by token
        const users = await sql`
            SELECT id, reset_token_expires 
            FROM "User" 
            WHERE reset_token = ${token}
        `;

        if (users.length === 0) {
            return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 });
        }

        const user = users[0];

        // Ensure token has not expired
        const now = new Date();
        const expiresAt = new Date(user.reset_token_expires);

        if (now > expiresAt) {
            return NextResponse.json({ success: false, error: "Reset token has expired." }, { status: 400 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset tokens
        await sql`
            UPDATE "User"
            SET password = ${hashedPassword},
                reset_token = NULL,
                reset_token_expires = NULL
            WHERE id = ${user.id}
        `;

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (error: any) {
        console.error("Reset password API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
