import { ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs", className)}>
      <ShieldCheck className="size-4.5" aria-hidden />
    </span>
  )
}
