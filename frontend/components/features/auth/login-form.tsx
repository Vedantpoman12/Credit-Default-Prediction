"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthDivider, AuthFooterLink, AuthHeading, FormAlert } from "@/components/features/auth/auth-parts"
import { PasswordInput } from "@/components/features/auth/password-input"
import { SocialButtons } from "@/components/features/auth/social-buttons"
import { login } from "@/lib/actions/auth"
import { type LoginInput, loginSchema } from "@/lib/schemas"

type LoginFormProps = { callbackUrl?: string; initialError?: string; oauth: { google: boolean; github: boolean } }

export function LoginForm({ callbackUrl, initialError, oauth }: LoginFormProps) {
  const [error, setError] = useState(initialError)
  const [pending, startTransition] = useTransition()
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", remember: true }, mode: "onSubmit", reValidateMode: "onChange" })
  const { errors } = form.formState

  const submit = (values: LoginInput) =>
    startTransition(async () => {
      setError(undefined)
      const result = await login(values, callbackUrl)
      if (result?.error) {
        setError(result.error)
        form.setValue("password", "")
        form.setFocus("password")
      }
    })

  return (
    <div className="space-y-6">
      <AuthHeading title="Sign in" description="Welcome back. Enter your details to continue." />
      <FormAlert message={error} />

      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
        <Field data-invalid={Boolean(errors.email)} className="gap-1.5">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" aria-invalid={Boolean(errors.email)} className="h-10" {...form.register("email")} />
          <FieldError errors={[errors.email]} className="text-xs" />
        </Field>
        <Field data-invalid={Boolean(errors.password)} className="gap-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="rounded text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} className="h-10" {...form.register("password")} />
          <FieldError errors={[errors.password]} className="text-xs" />
        </Field>
        <Controller
          control={form.control}
          name="remember"
          render={({ field }) => (
            <Field orientation="horizontal" className="gap-2">
              <Checkbox id="remember" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              <FieldLabel htmlFor="remember" className="font-normal">
                Remember me for 30 days
              </FieldLabel>
            </Field>
          )}
        />
        <motion.div whileTap={{ scale: 0.985 }}>
          <Button type="submit" size="lg" className="h-10 w-full shadow-glow" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </motion.div>
      </form>

      <AuthDivider />
      <SocialButtons enabled={oauth} callbackUrl={callbackUrl} />
      <AuthFooterLink prompt="Don't have an account?" href="/signup" label="Create one" />
    </div>
  )
}
