import "server-only"

import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { z } from "zod"

import { hashPassword, verifyPassword } from "@/lib/password"

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  createdAt: z.string(),
})
type StoredUser = z.infer<typeof userSchema>
export type PublicUser = { id: string; name: string; email: string }

const USERS_FILE = process.env.USERS_FILE ?? path.join(process.cwd(), ".data", "users.json")

const normalise = (email: string) => email.trim().toLowerCase()

/** The account configured through environment variables (AUTH_USER_*), if any. */
function configuredUser(): (PublicUser & { passwordHash: string }) | null {
  const email = process.env.AUTH_USER_EMAIL?.trim().toLowerCase()
  const passwordHash = process.env.AUTH_USER_PASSWORD_HASH
  if (!email || !passwordHash) return null
  return { id: email, email, name: process.env.AUTH_USER_NAME ?? email.split("@")[0], passwordHash }
}

async function readUsers(): Promise<StoredUser[]> {
  try {
    return z.array(userSchema).parse(JSON.parse(await readFile(/*turbopackIgnore: true*/ USERS_FILE, "utf8")))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await mkdir(/*turbopackIgnore: true*/ path.dirname(USERS_FILE), { recursive: true })
  const temp = `${USERS_FILE}.${process.pid}.tmp`
  await writeFile(/*turbopackIgnore: true*/ temp, JSON.stringify(users, null, 2), { mode: 0o600 })
  await rename(/*turbopackIgnore: true*/ temp, USERS_FILE)
}

let writes: Promise<unknown> = Promise.resolve()

/** Creates an account; writes are serialised so concurrent sign-ups cannot create duplicates. */
export function createUser(input: { name: string; email: string; password: string }): Promise<{ ok: true; user: PublicUser } | { ok: false; reason: "exists" }> {
  const task = writes.then(async () => {
    const email = normalise(input.email)
    const users = await readUsers()
    if (configuredUser()?.email === email || users.some((u) => u.email === email)) return { ok: false as const, reason: "exists" as const }
    const user: StoredUser = { id: randomUUID(), name: input.name.trim(), email, passwordHash: await hashPassword(input.password), createdAt: new Date().toISOString() }
    await writeUsers([...users, user])
    return { ok: true as const, user: { id: user.id, name: user.name, email: user.email } }
  })
  writes = task.catch(() => undefined)
  return task
}

/** Returns the user when the email/password pair is valid, otherwise null. */
export async function authenticate(emailInput: string, password: string): Promise<PublicUser | null> {
  const email = normalise(emailInput)
  const candidate = configuredUser()?.email === email ? configuredUser() : (await readUsers()).find((u) => u.email === email)
  if (!candidate || !(await verifyPassword(password, candidate.passwordHash))) return null
  return { id: candidate.id, name: candidate.name, email: candidate.email }
}
