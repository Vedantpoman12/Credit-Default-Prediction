import { connection } from "next/server"
import { AlertTriangle, Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type Stat, StatGrid } from "@/components/features/model/stat-grid"
import { TprChartLazy } from "@/components/features/model/tpr-chart-lazy"
import { RefreshButton } from "@/components/features/shared/refresh-button"
import { StateMessage } from "@/components/features/shared/states"
import { ApiError, api } from "@/lib/api"
import { policyLabel } from "@/lib/labels"
import { AGE_BANDS, type ModelInfo } from "@/lib/schemas"

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" })

function performanceStats(info: ModelInfo): Stat[] {
  const m = info.metrics
  return [
    { label: "ROC-AUC", value: m.val_roc_auc[0], format: "decimal", hint: `95% CI ${m.val_roc_auc[1].toFixed(3)}–${m.val_roc_auc[2].toFixed(3)}` },
    { label: "PR-AUC", value: m.val_pr_auc[0], format: "decimal", hint: `95% CI ${m.val_pr_auc[1].toFixed(3)}–${m.val_pr_auc[2].toFixed(3)}` },
    { label: "Calibration error (ECE)", value: m.val_ece_calibrated_oof, format: "decimal", hint: `Out-of-fold · ${m.val_ece_uncalibrated.toFixed(3)} before calibration` },
    { label: "F1 (deployed policy)", value: m.deployed_policy_val.f1, format: "decimal", hint: "At the deployed decision threshold" },
    { label: "TPR gap across age bands", value: m.deployed_policy_val.tpr_gap, format: "decimal", hint: "Equal opportunity · target ≤ 0.05" },
    { label: "FPR gap across age bands", value: m.deployed_policy_val.fpr_gap, format: "decimal", hint: "Reported, not constrained" },
  ]
}

export async function ModelSection() {
  await connection()
  let info: ModelInfo
  try {
    info = await api.modelInfo()
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    return (
      <Card className="shadow-card">
        <StateMessage tone="error" icon={AlertTriangle} title="Couldn't load model details" description={error.message} action={<RefreshButton label="Try again" />} />
      </Card>
    )
  }

  const gates = info.fairness_gates
  const tpr = gates
    ? AGE_BANDS.filter((band) => band in gates.fairness_gate.tpr_by_group).map((band) => ({
        band,
        tpr: gates.fairness_gate.tpr_by_group[band],
        excluded: gates.fairness_gate.excluded_small_groups.includes(band),
      }))
    : []
  const details: Array<[string, string]> = [
    ["Fairness policy", policyLabel(info.policy_kind)],
    ["Age band needed at scoring", info.requires_age_band ? "Yes, for threshold lookup only" : "No"],
    ["Calibration", info.metrics.calibration_method === "sigmoid" ? "Platt scaling" : info.metrics.calibration_method],
    ["Model inputs", `${info.features.length} (age and sex excluded)`],
    ["Model version", info.model_version],
    ["Training data checksum", `${info.training_data_checksum.slice(0, 16)}…`],
    ["Built", dateFormat.format(new Date(info.created_at))],
  ]

  return (
    <div className="space-y-8">
      <section aria-labelledby="perf-heading" className="space-y-4">
        <h2 id="perf-heading" className="text-sm font-semibold">
          Validation performance
        </h2>
        <StatGrid stats={performanceStats(info)} />
      </section>

      {gates && (
        <section aria-labelledby="gates-heading" className="space-y-4">
          <h2 id="gates-heading" className="text-sm font-semibold">
            CI gates
          </h2>
          <StatGrid
            columns="lg:grid-cols-2"
            stats={[
              { label: `Performance gate · AUC ≥ ${gates.performance_gate.threshold}`, value: gates.performance_gate.roc_auc, format: "decimal", hint: "Blocks deployment of a weaker model", gate: gates.performance_gate },
              { label: `Fairness gate · TPR gap ≤ ${gates.fairness_gate.threshold}`, value: gates.fairness_gate.tpr_gap, format: "decimal", hint: "Blocks deployment of an unfair model", gate: gates.fairness_gate },
            ]}
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {tpr.length > 0 && (
          <Card className="shadow-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">True-positive rate by age band</CardTitle>
              <CardDescription>Share of actual defaulters caught in each band on validation. Equal bars mean equal opportunity.</CardDescription>
            </CardHeader>
            <CardContent>
              <TprChartLazy data={tpr} />
              {gates && gates.fairness_gate.excluded_small_groups.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5" aria-hidden /> Lighter bars ({gates.fairness_gate.excluded_small_groups.join(", ")}) have fewer than 30 applicants and are excluded from the gap.
                </p>
              )}
            </CardContent>
          </Card>
        )}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">About this model</CardTitle>
            <CardDescription>{info.notice}.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ModelSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading model details">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
    </div>
  )
}
