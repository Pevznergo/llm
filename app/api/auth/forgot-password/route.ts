import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        // Check if user exists
        const users = await sql`SELECT id, email, name FROM "User" WHERE email = ${email}`;

        if (users.length === 0) {
            // We return success even if user not found to prevent email enumeration
            return NextResponse.json({ success: true, message: "If an account with that email exists, we sent a reset link." });
        }

        const user = users[0];

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Expiration time (1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Update user in DB
        await sql`
            UPDATE "User"
            SET reset_token = ${resetToken}, reset_token_expires = ${expiresAt.toISOString()}
            WHERE id = ${user.id}
        `;

        // Create the reset URL
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/reset-password?token=${resetToken}`;

        // Send Email
        await resend.emails.send({
            from: 'Aporto Tech <noreply@aporto.tech>', // Adjust based on your verified domain in Resend
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #0284c7;">Aporto.tech Password Reset</h2>
                    <p>Hello ${user.name || 'User'},</p>
                    <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                    <p>To reset your password, click the button below (link expires in 1 hour):</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:<br/>${resetUrl}</p>
                </div>
            `
        });

        return NextResponse.json({ success: true, message: "Reset link sent" });

    } catch (error: any) {
        console.error("Forgot password API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
