"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { ApplicantForm } from "@/components/features/score/applicant-form"
import { PRESETS } from "@/components/features/score/presets"
import { RecourseDialog } from "@/components/features/score/recourse-dialog"
import { ResultPanel } from "@/components/features/score/result-panel"
import { findRecourse, scoreApplicant } from "@/lib/actions/score"
import { type Applicant, type Recourse, type ScoreResult, applicantSchema } from "@/lib/schemas"

function showError(error: string, details?: string[]): void {
  toast.error(error, { description: details?.slice(0, 3).join(" · ") })
}

export function ScoreWorkspace() {
  const form = useForm<Applicant>({ resolver: zodResolver(applicantSchema), defaultValues: PRESETS[1].values, mode: "onTouched" })
  const values = useWatch({ control: form.control })
  const [result, setResult] = useState<{ data: ScoreResult; key: string } | null>(null)
  const [recourse, setRecourse] = useState<Recourse | null>(null)
  const [recourseOpen, setRecourseOpen] = useState(false)
  const [scoring, startScoring] = useTransition()
  const [searching, startSearching] = useTransition()
  const stale = result !== null && result.key !== JSON.stringify(values)

  const submit = (applicant: Applicant) =>
    startScoring(async () => {
      const response = await scoreApplicant(applicant)
      if (!response.ok) return showError(response.error, response.details)
      setResult({ data: response.data, key: JSON.stringify(applicant) })
      setRecourse(null)
    })

  const openRecourse = () => {
    setRecourseOpen(true)
    if (recourse) return
    startSearching(async () => {
      const response = await findRecourse(form.getValues())
      if (!response.ok) {
        setRecourseOpen(false)
        return showError(response.error, response.details)
      }
      setRecourse(response.data)
    })
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ApplicantForm form={form} onSubmit={submit} pending={scoring} onPreset={(preset) => form.reset(preset)} />
      <div className="lg:sticky lg:top-[calc(var(--topbar-height)+1.5rem)]">
        <ResultPanel result={result?.data ?? null} pending={scoring} stale={stale} onRecourse={openRecourse} />
      </div>
      <RecourseDialog open={recourseOpen} onOpenChange={setRecourseOpen} recourse={recourse} loading={searching} />
    </div>
  )
}
