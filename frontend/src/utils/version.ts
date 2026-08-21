export function bumpVersion(version: string): string {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map((part) => Number(part) || 0)
  return `${major}.${minor}.${patch + 1}`
}
