"use server"

import { auth } from "@/auth"
import { ApiError, api } from "@/lib/api"
import { type Applicant, type Recourse, type ScoreResult, applicantSchema } from "@/lib/schemas"

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; details?: string[] }

async function run<T>(input: unknown, call: (applicant: Applicant) => Promise<T>): Promise<ActionResult<T>> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: "Your session has expired. Please sign in again." }
  const parsed = applicantSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Some fields are invalid.", details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }
  try {
    return { ok: true, data: await call(parsed.data) }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message, details: error.details }
    throw error
  }
}

export async function scoreApplicant(input: unknown): Promise<ActionResult<ScoreResult>> {
  return run(input, api.score)
}

export async function findRecourse(input: unknown): Promise<ActionResult<Recourse>> {
  return run(input, api.recourse)
}
