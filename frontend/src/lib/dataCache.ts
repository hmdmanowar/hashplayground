// Module-level, in-memory cache so revisiting a page (after React Router
// unmounts/remounts it) can render the last-known data immediately instead
// of flashing a loading state, while the page still refetches in the
// background to stay fresh. Cleared on full page reload — intentionally not
// persisted, since it only needs to survive client-side navigation.
const cache = new Map<string, unknown>()

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value)
}
