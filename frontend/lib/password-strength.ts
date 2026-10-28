export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: "Too short" | "Weak" | "Fair" | "Good" | "Strong" }

/** Simple heuristic: length plus character variety. Shown as guidance only; the hard rule is 8+ characters. */
export function passwordStrength(password: string): Strength {
  if (password.length < 8) return { score: 0, label: "Too short" }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  const points = variety + (password.length >= 12 ? 1 : 0) + (password.length >= 16 ? 1 : 0)
  if (points <= 2) return { score: 1, label: "Weak" }
  if (points === 3) return { score: 2, label: "Fair" }
  if (points === 4) return { score: 3, label: "Good" }
  return { score: 4, label: "Strong" }
}
