import type { Metadata } from "next"
import { Suspense } from "react"

import { DecisionsSection, DecisionsSkeleton } from "@/components/features/decisions/decisions-section"
import { PageHeader } from "@/components/features/shared/page-header"
import { RefreshButton } from "@/components/features/shared/refresh-button"

export const metadata: Metadata = { title: "Recent decisions" }

export default function DecisionsPage({ searchParams }: PageProps<"/decisions">) {
  return (
    <>
      <PageHeader title="Recent decisions" description="The latest 50 scored applications from the audit log, newest first." actions={<RefreshButton />} />
      <Suspense fallback={<DecisionsSkeleton />}>
        <DecisionsSection searchParams={searchParams} />
      </Suspense>
    </>
  )
}
