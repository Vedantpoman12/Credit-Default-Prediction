import Link from "next/link"

import { Logo } from "@/components/features/layout/logo"

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo href="/" className="w-fit" />
          <p className="text-sm text-muted-foreground">Educational artefact. Not for real lending decisions.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/#how-it-works" className="hover:text-foreground">How it works</Link>
          <Link href="/#fairness" className="hover:text-foreground">Fairness</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  )
}
