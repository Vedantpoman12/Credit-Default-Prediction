import { BarChart3, ClipboardList, Gauge, Lightbulb, Scale, Sparkles, type LucideIcon } from "lucide-react"

export const FEATURES: ReadonlyArray<{ icon: LucideIcon; title: string; short: string; body: string }> = [
  {
    icon: Scale,
    title: "Equal opportunity",
    short: "Defaulters are caught at the same rate in every age band.",
    body: "A fairness constraint keeps the true-positive rate level across age bands, so no group carries extra error at the same level of real risk.",
  },
  {
    icon: BarChart3,
    title: "Calibrated & explained",
    short: "Real probabilities, with the top factors behind every score.",
    body: "Scores are calibrated, so 20% means about one in five similar applicants default. SHAP shows the factors that pushed each score up or down.",
  },
  {
    icon: Sparkles,
    title: "Actionable recourse",
    short: "Concrete changes that would turn a decline into an approval.",
    body: "Counterfactual search suggests realistic changes, such as paying more of a bill, and checks that each one actually flips the decision.",
  },
]

export const STEPS: ReadonlyArray<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: ClipboardList, title: "Enter applicant details", body: "Credit limit plus six months of repayment status, bills and payments. Or start from an example." },
  { icon: Gauge, title: "Get a calibrated probability", body: "A default probability you can read literally, with an approve, refer or decline recommendation." },
  { icon: BarChart3, title: "See the top factors", body: "SHAP explanations show which parts of the history raised or lowered the risk." },
  { icon: Lightbulb, title: "Get recourse suggestions", body: "For declined applicants, verified changes that would lead to approval. Age is never changed." },
]
