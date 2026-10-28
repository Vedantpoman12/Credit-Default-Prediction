import "server-only"

import { z } from "zod"

import {
  type Applicant,
  decisionRecordSchema,
  modelInfoSchema,
  recourseSchema,
  scoreResultSchema,
} from "@/lib/schemas"

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message)
    this.name = "ApiError"
  }
}

const validationDetail = z.object({ detail: z.union([z.string(), z.array(z.object({ loc: z.array(z.union([z.string(), z.number()])), msg: z.string() }))]) })

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 10_000, ...rest } = init
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...rest.headers },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    throw new ApiError("The scoring service is unreachable.", 503)
  }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const parsed = validationDetail.safeParse(body)
    const details = !parsed.success
      ? []
      : typeof parsed.data.detail === "string"
        ? [parsed.data.detail]
        : parsed.data.detail.map((d) => `${String(d.loc.at(-1))}: ${d.msg}`)
    throw new ApiError(response.status === 422 ? "Some fields are invalid." : "The scoring service returned an error.", response.status, details)
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ApiError("The scoring service returned an unexpected response.", 502)
  return parsed.data
}

const post = (body: Applicant) => ({ method: "POST", body: JSON.stringify(body) })

export const api = {
  score: (applicant: Applicant) => request("/score", scoreResultSchema, post(applicant)),
  recourse: (applicant: Applicant) => request("/recourse", recourseSchema, { ...post(applicant), timeoutMs: 60_000 }),
  decisions: (limit = 50) => request(`/decisions?limit=${limit}`, z.array(decisionRecordSchema)),
  modelInfo: () => request("/model-info", modelInfoSchema),
}
