"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type TprPoint = { band: string; tpr: number; excluded: boolean }

export default function TprChart({ data }: { data: TprPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="band" tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
        <YAxis domain={[0, 1]} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: "var(--color-muted)" }}
          contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
          formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, "True-positive rate"]}
        />
        <Bar dataKey="tpr" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={700}>
          {data.map((point) => (
            <Cell key={point.band} fill={point.excluded ? "var(--color-chart-2)" : "var(--color-chart-1)"} />
          ))}
          <LabelList dataKey="tpr" position="top" formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} style={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 500 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
