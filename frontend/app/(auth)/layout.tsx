import { AuthBackdrop } from "@/components/features/auth/auth-backdrop"
import { Logo } from "@/components/features/layout/logo"
import { FEATURES } from "@/components/features/landing/content"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r bg-linear-to-br from-hero via-background to-card p-12 lg:flex">
        <AuthBackdrop />
        <Logo href="/" className="relative w-fit" />
        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">Fair, explainable credit decisions.</h1>
          <ul className="space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-primary shadow-xs">
                  <feature.icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.short}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">Educational artefact. Not for real lending decisions.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Logo href="/" className="mb-8 w-fit lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  )
}
