import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { enabledOAuth } from "@/auth"
import { LoginForm } from "@/components/features/auth/login-form"

export const metadata: Metadata = { title: "Sign in", description: "Sign in to Fair Credit Scorer." }

const OAUTH_ERRORS: Record<string, string> = {
  AccessDenied: "This account isn't allowed to sign in.",
  OAuthSignin: "Couldn't start sign-in with that provider.",
  OAuthCallbackError: "Sign-in with that provider failed.",
  Configuration: "Sign-in is misconfigured. Contact your administrator.",
}

async function LoginFormLoader({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const errorCode = pick(params.error)
  return (
    <LoginForm
      callbackUrl={pick(params.callbackUrl)}
      initialError={errorCode ? (OAUTH_ERRORS[errorCode] ?? "Sign-in failed. Please try again.") : undefined}
      oauth={enabledOAuth}
    />
  )
}

function LoginSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading sign-in form">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginFormLoader searchParams={searchParams} />
    </Suspense>
  )
}
