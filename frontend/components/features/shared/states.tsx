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
    <div role={tone === "error" ? "alert" : undefined} className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <span
        className={cn(
          "mb-5 flex size-12 items-center justify-center rounded-[0.875rem]",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="text-section font-semibold">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
