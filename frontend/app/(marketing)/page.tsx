import { ArrowRight, Check } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DotGrid } from "@/components/features/auth/auth-backdrop"
import { FEATURES, STEPS } from "@/components/features/landing/content"
import { FairnessChart, FairnessChartSkeleton } from "@/components/features/landing/fairness-chart"
import { HeroPreview } from "@/components/features/landing/hero-preview"
import { HoverCard, Reveal } from "@/components/features/landing/reveal"

export const metadata: Metadata = {
  title: { absolute: "Fair Credit Scorer: fair, explainable credit decisions" },
  description: "Score credit applicants with calibrated default probabilities, an equal-opportunity fairness constraint, SHAP explanations and actionable recourse.",
}

const container = "mx-auto max-w-6xl px-4 sm:px-6"

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground text-pretty">{description}</p>
    </Reveal>
  )
}

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b bg-linear-to-b from-hero to-background">
        <DotGrid className="[mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className={`${container} relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:py-28`}>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden /> Fairness-constrained credit scoring
            </p>
            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">Fair, explainable credit decisions.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              Calibrated default probabilities, a decision that treats every age band equally, the reasons behind each score, and concrete steps to approval.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base shadow-glow">
                <Link href="/signup">
                  Get started <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 bg-card px-6 text-base">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </Reveal>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <HeroPreview />
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 py-20 sm:py-28">
        <div className={container}>
          <SectionHeading eyebrow="Features" title="Built for decisions you can defend" description="Every score comes with a probability you can trust, a fairness guarantee and an explanation." />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.08}>
                <HoverCard className="h-full">
                  <Card className="h-full gap-3 p-6 shadow-card transition-shadow hover:shadow-elevated">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <feature.icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm font-medium text-foreground/80">{feature.short}</p>
                    <p className="text-sm text-muted-foreground">{feature.body}</p>
                  </Card>
                </HoverCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y bg-card py-20 sm:py-28">
        <div className={container}>
          <SectionHeading eyebrow="How it works" title="From application to explanation in seconds" description="Four steps, all in one screen." />
          <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08} as="li">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold text-primary tabular-nums">{i + 1}</span>
                    <step.icon className="size-5 text-muted-foreground" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="fairness" className="scroll-mt-20 py-20 sm:py-28">
        <div className={`${container} grid items-center gap-12 lg:grid-cols-2`}>
          <Reveal>
            <p className="text-sm font-semibold text-primary">Fairness</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Equal opportunity across every age band</h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              A model can be accurate overall and still make more mistakes for some groups. The equal-opportunity constraint requires that applicants who will
              really default are caught at the same rate in every age band, so no group pays for the model&apos;s errors.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Age is never a model input. It is used only to audit fairness.",
                "Every deployment must pass a fairness gate: a TPR gap of 0.05 or less.",
                "Approval rates may still differ where real risk differs. Equal opportunity doesn't force identical outcomes.",
              ].map((point) => (
                <li key={point} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="p-6 shadow-card">
              <p className="text-sm font-semibold">Defaulters caught, by age band</p>
              <Suspense fallback={<FairnessChartSkeleton />}>
                <FairnessChart />
              </Suspense>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-linear-to-br from-hero via-card to-card px-6 py-14 text-center shadow-card sm:px-12">
          <DotGrid className="[mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance">Start scoring fairly today</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-muted-foreground">Create a free account and score your first applicant in under a minute.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base shadow-glow">
              <Link href="/signup">
                Create account <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 bg-card px-6 text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  )
}
