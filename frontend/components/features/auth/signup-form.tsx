"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthDivider, AuthFooterLink, AuthHeading, FormAlert } from "@/components/features/auth/auth-parts"
import { PasswordInput } from "@/components/features/auth/password-input"
import { PasswordStrengthMeter } from "@/components/features/auth/password-strength-meter"
import { SocialButtons } from "@/components/features/auth/social-buttons"
import { signup } from "@/lib/actions/auth"
import { type SignupInput, signupSchema } from "@/lib/schemas"

export function SignupForm({ oauth }: { oauth: { google: boolean; github: boolean } }) {
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", terms: false },
    mode: "onSubmit", reValidateMode: "onChange",
  })
  const password = useWatch({ control: form.control, name: "password" })
  const { errors } = form.formState

  const submit = (values: SignupInput) =>
    startTransition(async () => {
      setError(undefined)
      const result = await signup(values)
      if (!result) return
      setError(result.error)
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof SignupInput, { message })
      }
      if (result.fieldErrors?.email) form.setFocus("email")
    })

  return (
    <div className="space-y-6">
      <AuthHeading title="Create your account" description="Start scoring applicants with fair, explainable decisions." />
      <FormAlert message={error} />

      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
        <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" autoComplete="name" autoFocus placeholder="Ada Lovelace" aria-invalid={Boolean(errors.name)} className="h-10" {...form.register("name")} />
          <FieldError errors={[errors.name]} className="text-xs" />
        </Field>
        <Field data-invalid={Boolean(errors.email)} className="gap-1.5">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} className="h-10" {...form.register("email")} />
          <FieldError errors={[errors.email]} className="text-xs" />
        </Field>
        <Field data-invalid={Boolean(errors.password)} className="gap-1.5">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-strength"
            className="h-10"
            {...form.register("password", { onChange: () => form.formState.isSubmitted && form.trigger("confirmPassword") })}
          />
          <FieldError errors={[errors.password]} className="text-xs" />
          <PasswordStrengthMeter id="password-strength" password={password} />
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword)} className="gap-1.5">
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} className="h-10" {...form.register("confirmPassword")} />
          <FieldError errors={[errors.confirmPassword]} className="text-xs" />
        </Field>
        <Controller
          control={form.control}
          name="terms"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel htmlFor="terms" className="inline font-normal text-foreground">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </FieldLabel>
              </div>
              <FieldError errors={[fieldState.error]} className="text-xs" />
            </Field>
          )}
        />
        <motion.div whileTap={{ scale: 0.985 }}>
          <Button type="submit" size="lg" className="h-10 w-full shadow-glow" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </motion.div>
      </form>

      <AuthDivider />
      <SocialButtons enabled={oauth} />
      <AuthFooterLink prompt="Already have an account?" href="/login" label="Sign in" />
    </div>
  )
}
