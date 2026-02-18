import { NextRequest, NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Ensure DB is initialized
        await initDatabase();

        // Check if user already exists
        const existing = await sql`SELECT id FROM "User" WHERE email = ${email}`;
        if (existing.length > 0) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await sql`
            INSERT INTO "User" (email, name, password)
            VALUES (${email}, ${name}, ${hashedPassword})
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
