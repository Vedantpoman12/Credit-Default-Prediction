"use client"

import { motion } from "motion/react"

import { Card } from "@/components/ui/card"
import { DecisionBadge } from "@/components/features/score/decision-badge"
import { FactorList } from "@/components/features/score/factor-list"
import { ProbabilityMeter } from "@/components/features/score/probability-meter"
import type { Contribution } from "@/lib/schemas"

const EXAMPLE_FACTORS: Contribution[] = [
  { feature: "PAY_0", value: -1, shap: -0.348 },
  { feature: "MONTHS_LATE", value: 0, shap: -0.186 },
  { feature: "PAY_AMT2", value: 15000, shap: -0.169 },
  { feature: "UTIL_TREND", value: 0.08, shap: 0.061 },
]

/** Illustrative result card built from the same components as the real dashboard. */
export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
      <Card className="gap-5 p-6 shadow-elevated" role="img" aria-label="Example result: approve, 4.8% probability of default">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Result</p>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">Example</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <DecisionBadge decision="approve" />
          <div className="text-right">
            <p className="text-4xl font-semibold tracking-tight tabular-nums">4.8%</p>
            <p className="text-xs text-muted-foreground">probability of default</p>
          </div>
        </div>
        <ProbabilityMeter probability={0.048} />
        <div className="border-t pt-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground">Top factors</p>
          <FactorList factors={EXAMPLE_FACTORS} compact />
        </div>
      </Card>
    </motion.div>
  )
}
