import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { z } from "zod"

import { authenticate } from "@/lib/users"

const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000
const SESSION_MS = 12 * 60 * 60 * 1000

export const enabledOAuth = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
}

const allowedOAuthEmails = new Set(
  (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
)

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.enum(["true", "false"]).default("false"),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: REMEMBER_MS / 1000 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, remember: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password, remember } = parsed.data
        const user = await authenticate(email, password)
        return user ? { ...user, remember: remember === "true" } : null
      },
    }),
    ...(enabledOAuth.google ? [Google] : []),
    ...(enabledOAuth.github ? [GitHub] : []),
  ],
  callbacks: {
    signIn({ account, user }) {
      if (account?.provider === "credentials" || allowedOAuthEmails.size === 0) return true
      return Boolean(user.email && allowedOAuthEmails.has(user.email.toLowerCase()))
    },
    jwt({ token, user }) {
      if (user) {
        token.remember = user.remember ?? false
        token.loginAt = Date.now()
      }
      const lifetime = token.remember ? REMEMBER_MS : SESSION_MS
      if (typeof token.loginAt === "number" && Date.now() - token.loginAt > lifetime) return null
      return token
    },
  },
})
