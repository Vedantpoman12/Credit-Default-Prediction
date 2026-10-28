import type { ReactNode } from "react"

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Placeholder for an educational project. Have it reviewed before any real use.</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/90 [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-semibold">{children}</div>
    </article>
  )
}
