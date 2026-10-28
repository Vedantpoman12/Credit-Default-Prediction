"use client"

import { Loader2, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DecisionsFilter({ initialQuery, total, shown }: { initialQuery: string; total: number; shown: number }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [pending, startTransition] = useTransition()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const id = window.setTimeout(() => {
      const q = query.trim()
      startTransition(() => router.replace(q ? `/decisions?q=${encodeURIComponent(q)}` : "/decisions", { scroll: false }))
    }, 250)
    return () => window.clearTimeout(id)
  }, [query, router])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <label htmlFor="decision-filter" className="sr-only">
          Filter decisions
        </label>
        {pending ? (
          <Loader2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        )}
        <Input
          id="decision-filter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by decision, age band, status…"
          className="h-9 bg-card pr-9 pl-9"
        />
        {query && (
          <Button variant="ghost" size="icon-xs" className="absolute top-1/2 right-2 -translate-y-1/2" onClick={() => setQuery("")} aria-label="Clear filter">
            <X />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {shown === total ? `${total} decisions` : `${shown} of ${total} decisions`}
      </p>
    </div>
  )
}
