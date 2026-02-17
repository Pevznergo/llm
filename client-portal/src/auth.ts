import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

import { getOrCreateUser } from "@/lib/litellm";

export const config = {
    theme: {
        logo: "https://next-auth.js.org/img/logo/logo-sm.png",
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (user && user.email) {
                try {
                    await getOrCreateUser(user.email);
                    return true;
                } catch (e) {
                    console.error("Failed to sync user with LiteLLM", e);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account, profile }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                // session.user.id = token.id as string
            }
            return session
        },
        authorized({ request, auth }) {
            // return !!auth
            return true
        },
    },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
