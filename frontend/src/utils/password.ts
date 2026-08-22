// Mirrors backend/src/lib/password.ts's STRONG_PASSWORD_REGEX exactly, so the
// client can reject an obviously-weak password before ever hitting the network.
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
export const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number'
