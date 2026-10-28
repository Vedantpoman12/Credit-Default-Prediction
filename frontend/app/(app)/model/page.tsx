import type { Metadata } from "next"
import { Suspense } from "react"

import { ModelSection, ModelSkeleton } from "@/components/features/model/model-section"
import { PageHeader } from "@/components/features/shared/page-header"

export const metadata: Metadata = { title: "Model & fairness" }

export default function ModelPage() {
  return (
    <>
      <PageHeader title="Model & fairness" description="How the deployed model performs, whether it passes the CI gates, and how evenly it treats each age band." />
      <Suspense fallback={<ModelSkeleton />}>
        <ModelSection />
      </Suspense>
    </>
  )
}
