import { MONTHS } from "@/lib/schemas"

export const PAY_STATUS_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: -2, label: "No credit used" },
  { value: -1, label: "Paid in full" },
  { value: 0, label: "Minimum paid" },
  ...Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: `${i + 1} month${i ? "s" : ""} late` })),
]

export const EDUCATION_OPTIONS = [
  { value: 1, label: "Graduate school" },
  { value: 2, label: "University" },
  { value: 3, label: "High school" },
  { value: 4, label: "Other" },
  { value: 0, label: "Unknown" },
] as const

export const MARRIAGE_OPTIONS = [
  { value: 1, label: "Married" },
  { value: 2, label: "Single" },
  { value: 3, label: "Other" },
  { value: 0, label: "Unknown" },
] as const

const FEATURE_LABELS: Record<string, string> = {
  LIMIT_BAL: "Credit limit",
  EDUCATION: "Education",
  MARRIAGE: "Marital status",
  UTIL_MEAN: "Avg utilisation",
  UTIL_MAX: "Peak utilisation",
  UTIL_TREND: "Utilisation trend",
  MONTHS_LATE: "Months late",
  MAX_DELAY: "Worst delay",
  MEAN_STATUS: "Avg repayment status",
  PAID_TO_BILLED: "Paid vs billed (5 mo)",
  HEADROOM: "Credit headroom",
}
const STATUS_FIELDS = ["PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"]
MONTHS.forEach((month, i) => {
  FEATURE_LABELS[STATUS_FIELDS[i]] = `Status ${month}`
  FEATURE_LABELS[`BILL_AMT${i + 1}`] = `Bill ${month}`
  FEATURE_LABELS[`PAY_AMT${i + 1}`] = `Paid ${month}`
  FEATURE_LABELS[`UTIL_${i + 1}`] = `Utilisation ${month}`
  FEATURE_LABELS[`PAY_RATIO_${i + 1}`] = `Paid vs bill ${month}`
})

export const featureLabel = (feature: string) => FEATURE_LABELS[feature] ?? feature

export const statusText = (value: number) => PAY_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? String(value)

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
export const formatNumber = (value: number) => integer.format(value)
export const formatPercent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`

export function featureValueText(feature: string, value: number): string {
  if (STATUS_FIELDS.includes(feature) || feature === "MAX_DELAY") return statusText(value)
  if (/^(UTIL_\d|UTIL_MEAN|UTIL_MAX|PAY_RATIO_|PAID_TO_BILLED|HEADROOM)/.test(feature)) return `${Math.round(value * 100)}%`
  if (feature === "UTIL_TREND") return `${value >= 0 ? "+" : "−"}${Math.abs(Math.round(value * 100))} pts`
  if (feature === "MONTHS_LATE") return `${value} of 6`
  if (feature === "MEAN_STATUS") return value.toFixed(2)
  return formatNumber(value)
}

export function policyLabel(kind: string): string {
  return (
    {
      exponentiated_gradient: "Exponentiated Gradient (reduction)",
      threshold_optimizer: "Threshold Optimizer (post-processing)",
      group_thresholds: "Per-band thresholds (post-processing)",
      unconstrained: "Unconstrained",
    }[kind] ?? kind
  )
}
