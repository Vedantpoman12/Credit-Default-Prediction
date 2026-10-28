import type { Metadata } from "next"

import { LegalPage } from "@/components/features/landing/legal-page"

export const metadata: Metadata = { title: "Terms" }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <h2>Educational use only</h2>
      <p>Fair Credit Scorer is an educational artefact. Its scores, decisions and suggestions must not be used to make real lending decisions about anyone.</p>
      <h2>Your account</h2>
      <p>You are responsible for keeping your password confidential and for activity under your account.</p>
      <h2>No warranty</h2>
      <p>The service is provided as is, without any warranty of accuracy, availability or fitness for a particular purpose.</p>
    </LegalPage>
  )
}
