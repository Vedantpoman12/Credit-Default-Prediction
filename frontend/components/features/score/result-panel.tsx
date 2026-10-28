"use client"

import { AnimatePresence, motion } from "motion/react"
import { ClipboardList, Lightbulb, UserCheck } from "lucide-react"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const swap = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.2 } }

function ResultSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Scoring applicant">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="space-y-3 pt-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  )
}

export function ResultPanel({ result, pending, stale, onRecourse }: ResultPanelProps) {
  return (
    <Card className="shadow-card" aria-live="polite">
      <CardHeader>
        <CardTitle className="text-base">Result</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait" initial={false}>
          {pending ? (
            <motion.div key="loading" {...swap}>
              <ResultSkeleton />
            </motion.div>
          ) : !result ? (
            <motion.div key="empty" {...swap}>
              <StateMessage icon={ClipboardList} title="No applicant scored yet" description="Fill in the form or load an example, then score the applicant." className="py-10" />
            </motion.div>
          ) : (
            <motion.div key={`${result.decision}-${result.default_probability}`} {...swap} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <DecisionBadge decision={result.decision} />
                <div className="text-right">
                  <AnimatedNumber value={result.default_probability} format={(v) => formatPercent(v)} className="block text-4xl font-semibold tracking-tight tabular-nums" />
                  <p className="text-xs text-muted-foreground">probability of default</p>
                </div>
              </div>

              <ProbabilityMeter probability={result.default_probability} />

              {result.requires_human_review && (
                <div className="flex gap-2.5 rounded-lg border bg-accent/60 px-3 py-2.5 text-sm">
                  <UserCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <p>Requires human review. A credit officer must make the final decision.</p>
                </div>
              )}

              {stale && <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">The form has changed since this result. Score again to update it.</p>}

              <div className="border-t pt-5">
                <h2 className="mb-4 text-sm font-semibold">Top factors (SHAP)</h2>
                <FactorList factors={result.top5_shap} />
              </div>

              {result.decision !== "approve" && (
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="lg" className="h-10 w-full" onClick={onRecourse} disabled={stale}>
                    <Lightbulb /> How could they be approved?
                  </Button>
                </motion.div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Model {result.model_version} · {result.policy_version}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
