"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/lib/actions/auth"
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/lib/schemas"

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" }, mode: "onSubmit", reValidateMode: "onChange" })
  const error = form.formState.errors.email

  const submit = (values: ForgotPasswordInput) =>
    startTransition(async () => {
      const result = await requestPasswordReset(values)
      if (result.ok) setSentTo(values.email)
    })

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sentTo ? (
        <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" role="status">
          <span className="flex size-11 items-center justify-center rounded-xl border bg-accent text-accent-foreground">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, a reset link is on its way. No email? Contact your administrator.
            </p>
          </div>
          <Button asChild variant="outline" size="lg" className="h-10 w-full">
            <Link href="/login">
              <ArrowLeft /> Back to sign in
            </Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a link to choose a new password.</p>
          </div>
          <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
            <Field data-invalid={Boolean(error)} className="gap-1.5">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" aria-invalid={Boolean(error)} className="h-10" {...form.register("email")} />
              <FieldError errors={[error]} className="text-xs" />
            </Field>
            <Button type="submit" size="lg" className="h-10 w-full shadow-glow" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <Link href="/login" className="flex items-center justify-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Back to sign in
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
