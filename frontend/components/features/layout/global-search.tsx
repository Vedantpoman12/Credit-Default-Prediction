"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, type FormEvent } from "react"

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
    <form role="search" onSubmit={submit} className="relative w-full max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search decisions
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id="global-search"
        ref={input}
        type="search"
        enterKeyHint="search"
        placeholder="Search decisions…"
        className="h-10 w-full rounded-full border border-input bg-background pr-11 pl-10 text-sm shadow-xs transition-[border-color,box-shadow,background-color] outline-none placeholder:text-muted-foreground hover:border-track-strong/70 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md border bg-card px-1.5 font-mono text-[11px] text-muted-foreground sm:flex">
        /
      </kbd>
    </form>
  )
}
