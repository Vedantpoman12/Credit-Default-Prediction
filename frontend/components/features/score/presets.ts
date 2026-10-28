import type { Applicant } from "@/lib/schemas"

type Series = [number, number, number, number, number, number]

function applicant(base: Pick<Applicant, "LIMIT_BAL" | "EDUCATION" | "MARRIAGE" | "age_band">, status: Series, bills: Series, paid: Series): Applicant {
  return {
    ...base,
    PAY_0: status[0], PAY_2: status[1], PAY_3: status[2], PAY_4: status[3], PAY_5: status[4], PAY_6: status[5],
    BILL_AMT1: bills[0], BILL_AMT2: bills[1], BILL_AMT3: bills[2], BILL_AMT4: bills[3], BILL_AMT5: bills[4], BILL_AMT6: bills[5],
    PAY_AMT1: paid[0], PAY_AMT2: paid[1], PAY_AMT3: paid[2], PAY_AMT4: paid[3], PAY_AMT5: paid[4], PAY_AMT6: paid[5],
  }
}

export const PRESETS = [
  {
    id: "reliable",
    label: "Reliable payer",
    values: applicant({ LIMIT_BAL: 200000, EDUCATION: 1, MARRIAGE: 1, age_band: "35-44" }, [-1, -1, -1, -1, -1, -1], [12000, 9000, 15000, 8000, 11000, 7000], [9000, 15000, 8000, 11000, 7000, 10000]),
  },
  {
    id: "occasional",
    label: "Occasional delays",
    values: applicant({ LIMIT_BAL: 80000, EDUCATION: 2, MARRIAGE: 2, age_band: "25-34" }, [0, 0, 1, 0, 0, 0], [60000, 58000, 55000, 52000, 50000, 48000], [2500, 2200, 2000, 2000, 1800, 1800]),
  },
  {
    id: "late",
    label: "Seriously late",
    values: applicant({ LIMIT_BAL: 50000, EDUCATION: 2, MARRIAGE: 1, age_band: "25-34" }, [2, 2, 2, 0, 0, 0], [49000, 47000, 45000, 43000, 40000, 38000], [0, 0, 1500, 1500, 1500, 1500]),
  },
] as const
