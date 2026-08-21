// The same two optional fields already gated on elsewhere (e.g. before
// creating or importing a project) — completion is just how many of them
// are filled in.
export function getProfileCompletionPercent(user: { name?: string; email?: string }): number {
  const fields = [user.name, user.email]
  const filled = fields.filter((field) => field?.trim()).length
  return Math.round((filled / fields.length) * 100)
}
