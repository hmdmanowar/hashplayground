// name/email are also gated on elsewhere (e.g. before creating or importing
// a project) — completion is just how many of these optional fields are
// filled in.
export function getProfileCompletionPercent(user: { name?: string; email?: string; phone?: string }): number {
  const fields = [user.name, user.email, user.phone]
  const filled = fields.filter((field) => field?.trim()).length
  return Math.round((filled / fields.length) * 100)
}
