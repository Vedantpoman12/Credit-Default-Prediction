"use client"

import { Loader2, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { Controller, type UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PRESETS } from "@/components/features/score/presets"
import { EDUCATION_OPTIONS, MARRIAGE_OPTIONS, PAY_STATUS_OPTIONS } from "@/lib/labels"
import { AGE_BANDS, type Applicant, type ApplicantField, BILL_FIELDS, MONTHS, PAID_FIELDS, PAY_STATUS_FIELDS } from "@/lib/schemas"

type Option = { value: number | string; label: string }

type FormProps = {
  form: UseFormReturn<Applicant>
  onSubmit: (values: Applicant) => void
  pending: boolean
  onPreset: (values: Applicant) => void
}

const grid = "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 xl:grid-cols-6"

function NumberField({ form, name, label, step = 100 }: { form: UseFormReturn<Applicant>; name: ApplicantField; label: string; step?: number }) {
  const error = form.formState.errors[name]
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </FieldLabel>
      <Input id={name} type="number" inputMode="decimal" step={step} aria-invalid={Boolean(error)} className="h-9 tabular-nums" {...form.register(name, { valueAsNumber: true })} />
      <FieldError errors={[error]} className="text-xs" />
    </Field>
  )
}

function SelectField({ form, name, label, options, numeric = true }: { form: UseFormReturn<Applicant>; name: ApplicantField; label: string; options: readonly Option[]; numeric?: boolean }) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-1.5">
          <FieldLabel htmlFor={name} className="text-xs font-medium text-muted-foreground">
            {label}
          </FieldLabel>
          <Select value={String(field.value)} onValueChange={(v) => field.onChange(numeric ? Number(v) : v)}>
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="h-9 w-full" onBlur={field.onBlur}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <FieldSet className="gap-4 border-t px-5 py-5 sm:px-6">
      <div>
        <FieldLegend className="mb-0 text-sm font-semibold">{title}</FieldLegend>
        {description ? <FieldDescription className="mt-1.5 text-xs">{description}</FieldDescription> : null}
      </div>
      {children}
    </FieldSet>
  )
}

export function ApplicantForm({ form, onSubmit, pending, onPreset }: FormProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-card">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-label="Applicant details">
        <div className="flex flex-wrap items-center gap-2 bg-muted/40 px-5 py-3.5 sm:px-6">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Load example</span>
          {PRESETS.map((preset) => (
            <motion.div key={preset.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
              <Button type="button" variant="outline" size="sm" className="bg-card" onClick={() => onPreset(preset.values)}>
                {preset.label}
              </Button>
            </motion.div>
          ))}
        </div>

        <Section title="Profile" description="The age band is never a model input. It is recorded for fairness auditing only.">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NumberField form={form} name="LIMIT_BAL" label="Credit limit (NT$)" step={1000} />
            <SelectField form={form} name="EDUCATION" label="Education" options={EDUCATION_OPTIONS} />
            <SelectField form={form} name="MARRIAGE" label="Marital status" options={MARRIAGE_OPTIONS} />
            <SelectField form={form} name="age_band" label="Age band" numeric={false} options={AGE_BANDS.map((b) => ({ value: b, label: b }))} />
          </div>
        </Section>

        <Section title="Repayment status" description="Most recent month first.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {PAY_STATUS_FIELDS.map((name, i) => (
              <SelectField key={name} form={form} name={name} label={MONTHS[i]} options={PAY_STATUS_OPTIONS} />
            ))}
          </div>
        </Section>

        <Section title="Bill statement amounts" description="NT$, most recent first.">
          <div className={grid}>
            {BILL_FIELDS.map((name, i) => (
              <NumberField key={name} form={form} name={name} label={MONTHS[i]} />
            ))}
          </div>
        </Section>

        <Section title="Amounts paid" description="NT$, most recent first.">
          <div className={grid}>
            {PAID_FIELDS.map((name, i) => (
              <NumberField key={name} form={form} name={name} label={MONTHS[i]} />
            ))}
          </div>
        </Section>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-4 sm:px-6">
          <p className="hidden text-xs text-muted-foreground sm:block">Scores are calibrated probabilities with a fairness-constrained decision.</p>
          <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} className="ml-auto">
            <Button type="submit" size="lg" disabled={pending} className="h-10 px-5 shadow-glow">
              {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {pending ? "Scoring…" : "Score applicant"}
            </Button>
          </motion.div>
        </div>
      </form>
    </Card>
  )
}
