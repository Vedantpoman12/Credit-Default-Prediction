"use client"

import { ArrowRight, CheckCircle2, SearchX } from "lucide-react"
import { motion } from "motion/react"

import { MotionDialog } from "@/components/ui/motion-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/features/shared/states"
import { featureLabel, formatNumber, statusText } from "@/lib/labels"
import type { Recourse } from "@/lib/schemas"
import { cn } from "@/lib/utils"

type RecourseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recourse: Recourse | null
  loading: boolean
}

const changeText = (feature: string, value: number) => (feature.startsWith("PAY_") && !feature.startsWith("PAY_AMT") ? statusText(value) : formatNumber(value))

export function RecourseDialog({ open, onOpenChange, recourse, loading }: RecourseDialogProps) {
  const verified = recourse?.counterfactuals.some((c) => c.verified_flip) ?? false
  return (
    <MotionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="How could this applicant be approved?"
      description="Counterfactuals from DiCE. Only actionable features change; age is locked."
    >
      {loading || !recourse ? (
        <div className="space-y-3" aria-busy="true" aria-label="Searching for counterfactuals">
          <Skeleton className="h-4 w-4/5" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : recourse.original_decision === "approve" ? (
        <StateMessage icon={CheckCircle2} title="Already approved" description="This applicant is approved, so no changes are needed." className="py-8" />
      ) : recourse.counterfactuals.length === 0 ? (
        <StateMessage icon={SearchX} title="No actionable change found" description="No change to repayment status or payment amounts reaches approval for this applicant." className="py-8" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            {verified ? recourse.message : "No actionable change reaches approval. The closest options would move the decision as shown."}
          </p>
          <motion.ol className="space-y-3" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
            {recourse.counterfactuals.map((cf, i) => (
              <motion.li
                key={i}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="rounded-xl border bg-card p-4 shadow-xs"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Option {i + 1}</p>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      cf.verified_flip ? "border-accent bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    {cf.verified_flip ? "Verified · approve" : `Leads to ${cf.new_decision}`}
                  </span>
                </div>
                <dl className="space-y-1.5 text-sm">
                  {Object.entries(cf.changes).map(([feature, change]) => (
                    <div key={feature} className="flex flex-wrap items-center justify-between gap-x-3">
                      <dt className="text-muted-foreground">{featureLabel(feature)}</dt>
                      <dd className="flex items-center gap-1.5 tabular-nums">
                        {changeText(feature, change.from)} <ArrowRight className="size-3.5 text-muted-foreground" aria-label="to" />
                        <span className="font-semibold">{changeText(feature, change.to)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      )}
    </MotionDialog>
  )
}
