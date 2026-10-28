"use client"

import { motion } from "motion/react"
import { UserCheck } from "lucide-react"

import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DecisionBadge } from "@/components/features/score/decision-badge"
import { formatNumber, formatPercent, statusText } from "@/lib/labels"
import type { DecisionRecord } from "@/lib/schemas"

const MotionRow = motion.create(TableRow)
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

export function DecisionsTable({ rows }: { rows: DecisionRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Time</TableHead>
            <TableHead className="text-right">Credit limit</TableHead>
            <TableHead>Latest status</TableHead>
            <TableHead>Age band</TableHead>
            <TableHead className="text-right">Probability</TableHead>
            <TableHead>Decision</TableHead>
            <TableHead className="pr-5">Review</TableHead>
          </TableRow>
        </TableHeader>
        <motion.tbody initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.025 } } }} className="[&_tr:last-child]:border-0">
          {rows.map((row, i) => (
            <MotionRow key={`${row.timestamp}-${i}`} variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}>
              <TableCell className="pl-5 whitespace-nowrap text-muted-foreground tabular-nums">{dateFormat.format(new Date(row.timestamp))}</TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(row.LIMIT_BAL)}</TableCell>
              <TableCell className="whitespace-nowrap">{statusText(row.PAY_0)}</TableCell>
              <TableCell className="tabular-nums">{row.age_band ?? "—"}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPercent(row.default_probability)}</TableCell>
              <TableCell>
                <DecisionBadge decision={row.decision} size="sm" />
              </TableCell>
              <TableCell className="pr-5">
                {row.requires_human_review ? (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <UserCheck className="size-3.5" aria-hidden /> Required
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </MotionRow>
          ))}
        </motion.tbody>
      </Table>
    </div>
  )
}
