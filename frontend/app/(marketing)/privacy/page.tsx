import type { Metadata } from "next"

import { LegalPage } from "@/components/features/landing/legal-page"

export const metadata: Metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we store</h2>
      <p>Your name, email address and a salted scrypt hash of your password. We never store your password itself.</p>
      <h2>Scored applications</h2>
      <p>Applicant details you submit, and the resulting decision, are written to an audit log for monitoring and fairness review.</p>
      <h2>Cookies</h2>
      <p>A single encrypted session cookie keeps you signed in. It is not used for tracking.</p>
    </LegalPage>
  )
}
