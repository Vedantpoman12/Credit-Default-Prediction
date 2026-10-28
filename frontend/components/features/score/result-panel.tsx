"use client"

import { AnimatePresence, motion } from "motion/react"
import { ClipboardList, Lightbulb, UserCheck } from "lucide-react"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DecisionBadge } from "@/components/features/score/decision-badge"
import { FactorList } from "@/components/features/score/factor-list"
import { ProbabilityMeter } from "@/components/features/score/probability-meter"
import { StateMessage } from "@/components/features/shared/states"
import { formatPercent } from "@/lib/labels"
import type { ScoreResult } from "@/lib/schemas"

type ResultPanelProps = {
  result: ScoreResult | null
  pending: boolean
  stale: boolean
  onRecourse: () => void
}

const swap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
}

function ResultSkeleton() {
  return (
    <div className="space-y-6 px-card pb-card" aria-busy="true" aria-label="Scoring applicant">
      <Skeleton className="h-12 w-36" />
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="space-y-4 pt-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}

export function ResultPanel({ result, pending, stale, onRecourse }: ResultPanelProps) {
  return (
    <section aria-labelledby="result-heading" aria-live="polite" className="overflow-clip rounded-card border bg-card shadow-card">
      <div className="flex min-h-16 items-center justify-between gap-3 px-card py-4">
        <h2 id="result-heading" className="text-section font-semibold">
          Result
        </h2>
        <AnimatePresence initial={false}>
          {result && !pending && (
            <motion.div key={result.decision} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <DecisionBadge decision={result.decision} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.div key="loading" {...swap}>
            <ResultSkeleton />
          </motion.div>
        ) : !result ? (
          <motion.div key="empty" {...swap} className="border-t">
            <StateMessage icon={ClipboardList} title="No applicant scored yet" description="Fill in the form or load an example, then score the applicant." />
          </motion.div>
        ) : (
          <motion.div key={`${result.decision}-${result.default_probability}`} {...swap}>
            <div className="space-y-5 px-card pb-card">
              <div>
                <AnimatedNumber value={result.default_probability} format={(v) => formatPercent(v)} className="block text-5xl leading-none font-semibold tracking-tight tabular-nums" />
                <p className="mt-2 text-sm text-muted-foreground">Probability of default</p>
              </div>
              <ProbabilityMeter probability={result.default_probability} />

              {result.requires_human_review && (
                <div className="flex gap-2.5 rounded-control bg-accent px-3.5 py-3 text-sm text-foreground">
                  <UserCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <p>Requires human review. A credit officer must make the final decision.</p>
                </div>
              )}

              {stale && <p className="rounded-control border border-dashed px-3.5 py-2.5 text-xs text-muted-foreground">The form has changed since this result. Score again to update it.</p>}
            </div>

            <div className="border-t px-card py-card">
              <h3 className="mb-4 text-section font-semibold">Top factors</h3>
              <FactorList factors={result.top5_shap} />
            </div>

            {result.decision !== "approve" && (
              <div className="border-t px-card py-4">
                <Button variant="outline" className="h-control w-full rounded-control bg-card shadow-xs active:scale-[0.98]" onClick={onRecourse} disabled={stale}>
                  <Lightbulb /> How could they be approved?
                </Button>
              </div>
            )}

            <p className="border-t bg-background/60 px-card py-3 text-[11px] text-muted-foreground tabular-nums">
              Model {result.model_version} · {result.policy_version}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
