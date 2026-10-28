import { AlertCircle, Check, X } from "lucide-react"

import type { Decision } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const STYLES: Record<Decision, { className: string; icon: typeof Check }> = {
  approve: { className: "border-primary bg-primary text-primary-foreground", icon: Check },
  refer: { className: "border-primary bg-card text-primary", icon: AlertCircle },
  decline: { className: "border-foreground bg-foreground text-background", icon: X },
}

export function DecisionBadge({ decision, size = "lg" }: { decision: Decision; size?: "sm" | "lg" }) {
  const { className, icon: Icon } = STYLES[decision]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-semibold uppercase",
        size === "lg" ? "rounded-lg px-3.5 py-2 text-sm tracking-wide" : "rounded-md px-2 py-0.5 text-[11px] tracking-wide",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3"} aria-hidden strokeWidth={2.5} />
      {decision}
    </span>
  )
}
