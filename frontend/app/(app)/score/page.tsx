import type { Metadata } from "next"

import { PageHeader } from "@/components/features/shared/page-header"
import { ScoreWorkspace } from "@/components/features/score/score-workspace"

export const metadata: Metadata = { title: "Score applicant" }

export default function ScorePage() {
  return (
    <>
      <PageHeader title="Score applicant" description="Enter an applicant's credit history to get a calibrated default probability, a fairness-constrained decision and the factors behind it." />
      <ScoreWorkspace />
    </>
  )
}
