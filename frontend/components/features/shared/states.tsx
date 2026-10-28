import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type StateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  tone?: "neutral" | "error"
  className?: string
}

export function StateMessage({ icon: Icon, title, description, action, tone = "neutral", className }: StateProps) {
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-xl border bg-card shadow-xs",
          tone === "error" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
