import bcrypt from 'bcryptjs'

const COST_FACTOR = 12

// One combined regex (rather than several chained zod .regex() checks) so a
// weak password always produces exactly one clear message, regardless of how
// many rules it fails — not a confusing concatenation of separate issues.
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
export const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number'

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR)
}

export function verifyPasswordHash(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
