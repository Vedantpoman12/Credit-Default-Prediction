import { AlertCircle, Check, X } from "lucide-react"

import type { Decision } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const STYLES: Record<Decision, { className: string; icon: typeof Check; label: string }> = {
  approve: { className: "border-primary bg-primary text-primary-foreground", icon: Check, label: "Approved" },
  refer: { className: "border-primary/30 bg-accent text-accent-foreground", icon: AlertCircle, label: "Refer" },
  decline: { className: "border-foreground bg-foreground text-background", icon: X, label: "Declined" },
}

export function DecisionBadge({ decision, size = "lg" }: { decision: Decision; size?: "sm" | "lg" }) {
  const { className, icon: Icon, label } = STYLES[decision]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "lg" ? "h-8 px-3.5 text-sm" : "h-6 px-2.5 text-xs",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3"} aria-hidden strokeWidth={2.5} />
      {label}
    </span>
  )
}
