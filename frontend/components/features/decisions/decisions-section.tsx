import { connection } from "next/server"
import { AlertTriangle, Inbox, SearchX } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DecisionsFilter } from "@/components/features/decisions/decisions-filter"
import { DecisionsTable } from "@/components/features/decisions/decisions-table"
import { RefreshButton } from "@/components/features/shared/refresh-button"
import { StateMessage } from "@/components/features/shared/states"
import { ApiError, api } from "@/lib/api"
import { formatNumber, statusText } from "@/lib/labels"
import type { DecisionRecord } from "@/lib/schemas"

const matches = (row: DecisionRecord, q: string) =>
  [row.decision, row.band, row.age_band ?? "", statusText(row.PAY_0), formatNumber(row.LIMIT_BAL), String(row.LIMIT_BAL), row.requires_human_review ? "review" : ""].some((v) =>
    v.toLowerCase().includes(q),
  )

export async function DecisionsSection({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await connection()
  const raw = (await searchParams).q
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? ""

  let rows: DecisionRecord[]
  try {
    rows = await api.decisions(50)
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    return (
      <Card className="shadow-card">
        <StateMessage tone="error" icon={AlertTriangle} title="Couldn't load decisions" description={error.message} action={<RefreshButton label="Try again" />} />
      </Card>
    )
  }

  const filtered = query ? rows.filter((row) => matches(row, query.toLowerCase())) : rows
  return (
    <div className="space-y-4">
      <DecisionsFilter initialQuery={query} total={rows.length} shown={filtered.length} />
      <Card className="gap-0 overflow-hidden py-0 shadow-card">
        {rows.length === 0 ? (
          <StateMessage icon={Inbox} title="No decisions yet" description="Decisions appear here as soon as applicants are scored." />
        ) : filtered.length === 0 ? (
          <StateMessage icon={SearchX} title="No matching decisions" description={`Nothing matches “${query}”. Try a decision, age band or repayment status.`} />
        ) : (
          <DecisionsTable rows={filtered} />
        )}
      </Card>
    </div>
  )
}

export function DecisionsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading decisions">
      <Skeleton className="h-9 w-full max-w-xs" />
      <Card className="gap-0 py-0 shadow-card">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-5 py-3.5 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </Card>
    </div>
  )
}
