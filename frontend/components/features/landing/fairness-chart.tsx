import { connection } from "next/server"

import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, api } from "@/lib/api"
import { AGE_BANDS } from "@/lib/schemas"
import { cn } from "@/lib/utils"

export async function FairnessChart() {
  await connection()
  let gate
  try {
    gate = (await api.modelInfo()).fairness_gates?.fairness_gate
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
  }
  if (!gate) {
    return <p className="mt-6 text-sm text-muted-foreground">Live figures are unavailable right now. Sign in to see the model dashboard.</p>
  }

  const rows = AGE_BANDS.filter((band) => band in gate.tpr_by_group).map((band) => ({
    band,
    percent: Math.round(gate.tpr_by_group[band] * 100),
    excluded: gate.excluded_small_groups.includes(band),
  }))

  return (
    <>
      <p className="mt-1 text-xs text-muted-foreground">
        Deployed model on validation data · TPR gap {gate.tpr_gap.toFixed(3)} (target ≤ {gate.threshold})
      </p>
      <dl className="mt-6 space-y-3">
        {rows.map(({ band, percent, excluded }) => (
          <div key={band} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 text-sm">
            <dt className="text-muted-foreground tabular-nums">{band.replace("-", "–")}</dt>
            <span className="h-2.5 rounded-full bg-track" aria-hidden>
              <span className={cn("block h-full rounded-full bg-primary", excluded && "opacity-40")} style={{ width: `${percent}%` }} />
            </span>
            <dd className="text-right font-medium tabular-nums">{percent}%</dd>
          </div>
        ))}
      </dl>
      {gate.excluded_small_groups.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Lighter bars ({gate.excluded_small_groups.join(", ")}) have too few applicants and are excluded from the gap.
        </p>
      )}
    </>
  )
}

export function FairnessChartSkeleton() {
  return (
    <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading fairness figures">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-5 rounded-md" />
      ))}
    </div>
  )
}
