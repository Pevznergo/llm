import NextAuth from "next-auth"
import { config } from "./auth"

export default NextAuth(config).auth

export const configMiddleware = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
