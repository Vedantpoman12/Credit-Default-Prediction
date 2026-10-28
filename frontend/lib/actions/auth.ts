"use server"

import { AuthError } from "next-auth"

import { signIn, signOut } from "@/auth"
import { type SignupInput, forgotPasswordSchema, loginSchema, signupSchema } from "@/lib/schemas"
import { createUser } from "@/lib/users"

function safeCallback(url: string | undefined): string {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/score"
}

export async function login(input: unknown, callbackUrl?: string): Promise<{ error: string } | undefined> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { error: "Enter a valid email and password." }
  const { email, password, remember } = parsed.data
  try {
    await signIn("credentials", { email, password, remember: String(remember), redirectTo: safeCallback(callbackUrl) })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.type === "CredentialsSignin" ? "Incorrect email or password." : "Sign-in failed. Please try again." }
    }
    throw error
  }
}

type SignupResult = { error?: string; fieldErrors?: Partial<Record<keyof SignupInput, string>> } | undefined

export async function signup(input: unknown): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SignupInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof SignupInput
      fieldErrors[key] ??= issue.message
    }
    return { error: "Please fix the highlighted fields.", fieldErrors }
  }
  const { name, email, password } = parsed.data
  const created = await createUser({ name, email, password })
  if (!created.ok) return { fieldErrors: { email: "An account with this email already exists." } }
  try {
    await signIn("credentials", { email, password, remember: "true", redirectTo: "/score" })
  } catch (error) {
    if (error instanceof AuthError) return { error: "Your account was created, but signing in failed. Please sign in." }
    throw error
  }
}

export async function loginWithProvider(provider: "google" | "github", callbackUrl?: string): Promise<void> {
  await signIn(provider, { redirectTo: safeCallback(callbackUrl) })
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" })
}

/** Validates the request; connect an email service here to deliver reset links. */
export async function requestPasswordReset(input: unknown): Promise<{ ok: boolean }> {
  return { ok: forgotPasswordSchema.safeParse(input).success }
}
