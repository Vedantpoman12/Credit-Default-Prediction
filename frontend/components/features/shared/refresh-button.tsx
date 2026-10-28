"use client"

import { RotateCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button variant="outline" size="lg" className="bg-card" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      <RotateCw className={cn(pending && "animate-spin")} /> {pending ? "Refreshing…" : label}
    </Button>
  )
}
