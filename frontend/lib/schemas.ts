import { z } from "zod"

export const AGE_BANDS = ["<25", "25-34", "35-44", "45-54", "55-64", "65+"] as const
export const MONTHS = ["Sep", "Aug", "Jul", "Jun", "May", "Apr"] as const
export const PAY_STATUS_FIELDS = ["PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"] as const
export const BILL_FIELDS = ["BILL_AMT1", "BILL_AMT2", "BILL_AMT3", "BILL_AMT4", "BILL_AMT5", "BILL_AMT6"] as const
export const PAID_FIELDS = ["PAY_AMT1", "PAY_AMT2", "PAY_AMT3", "PAY_AMT4", "PAY_AMT5", "PAY_AMT6"] as const

const number = (label: string) => z.number({ error: `${label} is required` })
const status = number("Repayment status").int().min(-2).max(9)
const bill = number("Bill amount").min(-1_000_000, "Must be at least −1,000,000").max(10_000_000, "Must be at most 10,000,000")
const paid = number("Amount paid").min(0, "Cannot be negative").max(10_000_000, "Must be at most 10,000,000")

export const applicantSchema = z.object({
  LIMIT_BAL: number("Credit limit").gt(0, "Must be greater than 0").max(10_000_000, "Must be at most 10,000,000"),
  EDUCATION: number("Education").int().min(0).max(6),
  MARRIAGE: number("Marital status").int().min(0).max(3),
  age_band: z.enum(AGE_BANDS, { error: "Select an age band" }),
  PAY_0: status,
  PAY_2: status,
  PAY_3: status,
  PAY_4: status,
  PAY_5: status,
  PAY_6: status,
  BILL_AMT1: bill,
  BILL_AMT2: bill,
  BILL_AMT3: bill,
  BILL_AMT4: bill,
  BILL_AMT5: bill,
  BILL_AMT6: bill,
  PAY_AMT1: paid,
  PAY_AMT2: paid,
  PAY_AMT3: paid,
  PAY_AMT4: paid,
  PAY_AMT5: paid,
  PAY_AMT6: paid,
})
export type Applicant = z.infer<typeof applicantSchema>
export type ApplicantField = keyof Applicant

export const DECISIONS = ["approve", "refer", "decline"] as const
export type Decision = (typeof DECISIONS)[number]

export const contributionSchema = z.object({ feature: z.string(), value: z.number(), shap: z.number() })
export type Contribution = z.infer<typeof contributionSchema>

export const scoreResultSchema = z.object({
  default_probability: z.number(),
  band: z.enum(["low", "medium", "high"]),
  decision: z.enum(DECISIONS),
  requires_human_review: z.boolean(),
  top5_shap: z.array(contributionSchema),
  model_version: z.string(),
  policy_version: z.string(),
})
export type ScoreResult = z.infer<typeof scoreResultSchema>

export const recourseSchema = z.object({
  original_decision: z.string(),
  counterfactuals: z.array(
    z.object({
      changes: z.record(z.string(), z.object({ from: z.number(), to: z.number() })),
      new_decision: z.string(),
      verified_flip: z.boolean(),
    }),
  ),
  message: z.string(),
})
export type Recourse = z.infer<typeof recourseSchema>

export const decisionRecordSchema = z.object({
  timestamp: z.string(),
  LIMIT_BAL: z.number(),
  PAY_0: z.number(),
  age_band: z.string().nullish(),
  default_probability: z.number(),
  band: z.string(),
  decision: z.enum(DECISIONS),
  requires_human_review: z.boolean(),
  model_version: z.string(),
})
export type DecisionRecord = z.infer<typeof decisionRecordSchema>

const gateSchema = z.object({ threshold: z.number(), passed: z.boolean() })
export const modelInfoSchema = z.object({
  notice: z.string(),
  model_version: z.string(),
  policy_version: z.string(),
  policy_kind: z.string(),
  requires_age_band: z.boolean(),
  created_at: z.string(),
  training_data_checksum: z.string(),
  features: z.array(z.string()),
  metrics: z.object({
    val_roc_auc: z.tuple([z.number(), z.number(), z.number()]),
    val_pr_auc: z.tuple([z.number(), z.number(), z.number()]),
    val_ece_uncalibrated: z.number(),
    val_ece_calibrated_oof: z.number(),
    calibration_method: z.string(),
    deployed_policy_val: z.object({ f1: z.number(), tpr_gap: z.number(), fpr_gap: z.number() }),
  }),
  fairness_gates: z
    .object({
      performance_gate: gateSchema.extend({ roc_auc: z.number() }),
      fairness_gate: gateSchema.extend({
        tpr_gap: z.number(),
        excluded_small_groups: z.array(z.string()),
        tpr_by_group: z.record(z.string(), z.number()),
      }),
    })
    .nullable(),
})
export type ModelInfo = z.infer<typeof modelInfoSchema>

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
})
export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    terms: z.boolean().refine((v) => v, "You must accept the Terms and Privacy Policy"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" })
export type SignupInput = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({ email: z.email("Enter a valid email address") })
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
