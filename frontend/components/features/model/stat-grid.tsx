"use client"

import { motion } from "motion/react"
import { CheckCircle2, XCircle } from "lucide-react"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type Stat = { label: string; value: number; hint: string; format: "decimal" | "percent"; gate?: { passed: boolean } }

const formatters = { decimal: (v: number) => v.toFixed(3), percent: (v: number) => `${(v * 100).toFixed(1)}%` }

export function StatGrid({ stats, columns = "lg:grid-cols-3" }: { stats: Stat[]; columns?: string }) {
  return (
    <motion.div
      className={cn("grid gap-4 sm:grid-cols-2", columns)}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -2 }}>
          <Card className="h-full gap-2 px-5 py-4.5 shadow-card transition-shadow hover:shadow-elevated">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.gate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    stat.gate.passed ? "border-accent bg-accent text-accent-foreground" : "border-foreground text-foreground",
                  )}
                >
                  {stat.gate.passed ? <CheckCircle2 className="size-3" aria-hidden /> : <XCircle className="size-3" aria-hidden />}
                  {stat.gate.passed ? "Pass" : "Fail"}
                </span>
              )}
            </div>
            <AnimatedNumber value={stat.value} format={formatters[stat.format]} className="text-3xl font-semibold tracking-tight tabular-nums" />
            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
