"use client"

import { motion } from "motion/react"

import { featureLabel, featureValueText } from "@/lib/labels"
import type { Contribution } from "@/lib/schemas"
import { cn } from "@/lib/utils"

export function FactorList({ factors, compact = false }: { factors: Contribution[]; compact?: boolean }) {
  const max = Math.max(...factors.map((f) => Math.abs(f.shap)), 0.01)
  return (
    <div>
      <motion.ul className="space-y-3" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
        {factors.map((factor) => {
          const raises = factor.shap > 0
          const width = (Math.abs(factor.shap) / max) * 50
          return (
            <motion.li
              key={factor.feature}
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              className="grid grid-cols-[minmax(0,8rem)_1fr_4.5rem] items-center gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{featureLabel(factor.feature)}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">{featureValueText(factor.feature, factor.value)}</p>
              </div>
              <div className="relative h-1.5 rounded-full bg-track" aria-hidden>
                <span className="absolute -inset-y-1 left-1/2 w-px bg-track-strong" />
                <motion.span
                  className={cn("absolute inset-y-0 rounded-full", raises ? "bg-track-strong" : "bg-primary")}
                  style={{ left: raises ? "50%" : `${50 - width}%`, width: `${width}%`, originX: raises ? 0 : 1 }}
                  variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
                  transition={{ type: "spring", stiffness: 160, damping: 22 }}
                />
              </div>
              <div className="text-right tabular-nums">
                <p className="font-semibold">
                  {raises ? "+" : "−"}
                  {Math.abs(factor.shap).toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">{raises ? "raises risk" : "lowers risk"}</p>
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
      {!compact && <FactorLegend />}
    </div>
  )
}

function FactorLegend() {
  return (
    <>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-track-strong" /> Raises risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" /> Lowers risk
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Bars right of the centre line push default risk up, bars to the left push it down. Factors explain the model&apos;s raw score; the final decision also applies
        calibration and the fairness constraint.
      </p>
    </>
  )
}
