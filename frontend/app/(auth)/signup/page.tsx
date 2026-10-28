import type { Metadata } from "next"

import { enabledOAuth } from "@/auth"
import { SignupForm } from "@/components/features/auth/signup-form"

export const metadata: Metadata = { title: "Create account", description: "Create a Fair Credit Scorer account." }

export default function SignupPage() {
  return <SignupForm oauth={enabledOAuth} />
}
