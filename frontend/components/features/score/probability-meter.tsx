"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const BANDS = [
  { label: "Low", range: "under 30%", from: 0, to: 0.3, flex: 0.3 },
  { label: "Medium", range: "30–60%", from: 0.3, to: 0.6, flex: 0.3 },
  { label: "High", range: "over 60%", from: 0.6, to: Infinity, flex: 0.4 },
]

export function ProbabilityMeter({ probability }: { probability: number }) {
  const p = Math.min(Math.max(probability, 0), 1)
  const active = BANDS.find((b) => p >= b.from && p < b.to) ?? BANDS[2]
  return (
    <div>
      <div
        className="relative flex h-2.5 gap-1"
        role="meter"
        aria-label="Default risk"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100)}
        aria-valuetext={`${(p * 100).toFixed(1)}%, ${active.label.toLowerCase()} risk`}
      >
        {BANDS.map((band) => (
          <div key={band.label} style={{ flex: band.flex }} className={cn("rounded-full transition-colors duration-500", band === active ? "bg-primary" : "bg-track")} />
        ))}
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-full"
          initial={{ x: "0%" }}
          animate={{ x: `${p * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <span className="absolute top-1/2 left-0 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card" />
        </motion.div>
      </div>
      <div className="mt-2 flex text-[11px] text-muted-foreground">
        {BANDS.map((band, i) => (
          <span key={band.label} style={{ flex: band.flex }} className={i === 2 ? "text-right" : undefined}>
            <span className="font-medium text-foreground/80">{band.label}</span> · {band.range}
          </span>
        ))}
      </div>
    </div>
  )
}
