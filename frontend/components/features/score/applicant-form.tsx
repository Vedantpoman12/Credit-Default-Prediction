"use client"

import { Loader2 } from "lucide-react"
import { Controller, type UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PRESETS } from "@/components/features/score/presets"
import { EDUCATION_OPTIONS, MARRIAGE_OPTIONS, PAY_STATUS_OPTIONS } from "@/lib/labels"
import { AGE_BANDS, type Applicant, type ApplicantField, BILL_FIELDS, MONTHS, PAID_FIELDS, PAY_STATUS_FIELDS } from "@/lib/schemas"
import { cn } from "@/lib/utils"

type Option = { value: number | string; label: string }
type FieldProps = { form: UseFormReturn<Applicant>; name: ApplicantField; label: string }

type FormProps = {
  form: UseFormReturn<Applicant>
  onSubmit: (values: Applicant) => void
  pending: boolean
  activePreset: string | null
  onPreset: (values: Applicant) => void
}

const labelClass = "text-(length:--text-label) leading-4 font-medium text-muted-foreground"

/** Severity dot for repayment status, using palette tones only: on time → green, minimum → mint, late → grey, very late → dark. */
function statusDot(value: number) {
  if (value < 0) return "bg-primary"
  if (value === 0) return "bg-primary/35"
  if (value <= 2) return "bg-track-strong"
  return "bg-foreground/75"
}

function NumberField({ form, name, label, currency = false, step = 100 }: FieldProps & { currency?: boolean; step?: number }) {
  const error = form.formState.errors[name]
  return (
    <Field data-invalid={Boolean(error)} className="gap-2">
      <FieldLabel htmlFor={name} className={labelClass}>
        {label}
      </FieldLabel>
      <div className="relative">
        {currency && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground" aria-hidden>
            NT$
          </span>
        )}
        <Input
          id={name}
          type="number"
          inputMode="decimal"
          step={step}
          aria-invalid={Boolean(error)}
          className={cn("tabular-nums", currency && "pl-11")}
          {...form.register(name, { valueAsNumber: true })}
        />
      </div>
      <FieldError errors={[error]} className="text-xs" />
    </Field>
  )
}

function SelectField({ form, name, label, options, numeric = true, status = false }: FieldProps & { options: readonly Option[]; numeric?: boolean; status?: boolean }) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-2">
          <FieldLabel htmlFor={name} className={labelClass}>
            {label}
          </FieldLabel>
          <Select value={String(field.value)} onValueChange={(v) => field.onChange(numeric ? Number(v) : v)}>
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="w-full" onBlur={field.onBlur}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {status && <span className={cn("size-2 shrink-0 rounded-full", statusDot(Number(o.value)))} aria-hidden />}
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} className="text-xs" />
        </Field>
      )}
    />
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t px-card py-card">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5">
        <h2 className="text-section font-semibold" aria-hidden>
          {title}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </fieldset>
  )
}

export function ApplicantForm({ form, onSubmit, pending, activePreset, onPreset }: FormProps) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      aria-label="Applicant details"
      className="@container overflow-clip rounded-card border bg-card shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-card py-5">
        <span id="preset-label" className={labelClass}>
          Load example
        </span>
        <div
          role="group"
          aria-labelledby="preset-label"
          className="flex w-full gap-1 overflow-x-auto rounded-full border bg-background p-1 [scrollbar-width:none] @md:w-auto [&::-webkit-scrollbar]:hidden"
        >
          {PRESETS.map((preset) => {
            const selected = activePreset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onPreset(preset.values)}
                className={cn(
                  "h-8 shrink-0 grow rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap @md:grow-0 transition-[color,background-color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-primary/15 active:scale-[0.98]",
                  selected ? "bg-card text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <Section title="Profile" description="The age band is never a model input. It is recorded for fairness auditing only.">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-4">
          <NumberField form={form} name="LIMIT_BAL" label="Credit limit" currency step={1000} />
          <SelectField form={form} name="EDUCATION" label="Education" options={EDUCATION_OPTIONS} />
          <SelectField form={form} name="MARRIAGE" label="Marital status" options={MARRIAGE_OPTIONS} />
          <SelectField form={form} name="age_band" label="Age band" numeric={false} options={AGE_BANDS.map((b) => ({ value: b, label: b }))} />
        </div>
      </Section>

      <Section title="Repayment status" description="Most recent month first.">
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-3">
          {PAY_STATUS_FIELDS.map((name, i) => (
            <SelectField key={name} form={form} name={name} label={MONTHS[i]} options={PAY_STATUS_OPTIONS} status />
          ))}
        </div>
      </Section>

      <Section title="Bill statement amounts" description="NT$, most recent first.">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 @md:grid-cols-3 @2xl:grid-cols-6">
          {BILL_FIELDS.map((name, i) => (
            <NumberField key={name} form={form} name={name} label={MONTHS[i]} currency />
          ))}
        </div>
      </Section>

      <Section title="Amounts paid" description="NT$, most recent first.">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 @md:grid-cols-3 @2xl:grid-cols-6">
          {PAID_FIELDS.map((name, i) => (
            <NumberField key={name} form={form} name={name} label={MONTHS[i]} currency />
          ))}
        </div>
      </Section>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-4 border-t bg-card/95 px-card py-4 backdrop-blur-sm md:bottom-0">
        <p className="hidden text-xs text-muted-foreground sm:block">Scores are calibrated probabilities with a fairness-constrained decision.</p>
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="ml-auto h-control w-full rounded-control px-5 shadow-xs transition-[background-color,transform,box-shadow] duration-150 hover:shadow-card active:scale-[0.98] sm:w-auto"
        >
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? "Scoring…" : "Score applicant"}
        </Button>
      </div>
    </form>
  )
}
