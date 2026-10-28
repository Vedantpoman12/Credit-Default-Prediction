import "server-only"

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>
const KEY_LENGTH = 64

/** Hashes a password as `scrypt:<salt b64url>:<key b64url>` (same format as `npm run hash-password`). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  const [scheme, salt, key] = stored?.split(":") ?? []
  if (scheme !== "scrypt" || !salt || !key) return false
  const expected = Buffer.from(key, "base64url")
  const actual = await scryptAsync(password, Buffer.from(salt, "base64url"), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
