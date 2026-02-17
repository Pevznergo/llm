
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { sql, initDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const users = await sql`SELECT * FROM "User" WHERE email = ${credentials.email}`;
                    const user = users[0];

                    if (user && user.password) {
                        const isValid = await bcrypt.compare(credentials.password, user.password);
                        if (isValid) {
                            return { id: user.id, name: user.name, email: user.email };
                        }
                    }
                    return null;
                } catch (e) {
                    console.error("Auth error:", e);
                    return null;
                }
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt" as const,
    },
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
        async signIn({ user, account, profile }: any) {
            if (account?.provider === 'google') {
                try {
                    const { email, name } = user;
                    // Ensure DB is initialized
                    await initDatabase();

                    // Check if user exists
                    const existingUser = await sql`SELECT * FROM "User" WHERE email = ${email}`;

                    if (existingUser.length === 0) {
                        console.log("Creating new Google user:", email);
                        await sql`
                            INSERT INTO "User" (email, name, password)
                            VALUES (${email}, ${name}, NULL)
                        `;
                    }
                    return true;
                } catch (error) {
                    console.error("CRITICAL DB ERROR during sign in:", error);
                    // It's often better to return false here if the user can't be created/found,
                    // but keeping true to maintain previous behavior unless requested otherwise.
                    return true;
                }
            }
            return true;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).id = token.sub;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    }
};
