"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, type FormEvent } from "react"

import { Input } from "@/components/ui/input"

export function GlobalSearch() {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !target.isContentEditable) {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const q = input.current?.value.trim() ?? ""
    router.push(q ? `/decisions?q=${encodeURIComponent(q)}` : "/decisions")
  }

  return (
    <form role="search" onSubmit={submit} className="relative w-full max-w-sm">
      <label htmlFor="global-search" className="sr-only">
        Search decisions
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input id="global-search" ref={input} type="search" placeholder="Search decisions…" className="h-9 bg-card pr-10 pl-9 shadow-xs" enterKeyHint="search" />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:block">
        /
      </kbd>
    </form>
  )
}
