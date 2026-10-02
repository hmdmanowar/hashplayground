import { PrismaClient } from '@prisma/client'

// Supabase's session-mode pooler allows only 15 clients in total, shared by
// prod and any local dev backend. Prisma's default pool size is derived from
// the host's CPU count (often far above 15 on Render), so a burst of parallel
// queries hit EMAXCONNSESSION. Cap the pool unless the URL already sets one.
const DEFAULT_CONNECTION_LIMIT = '5'

function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', DEFAULT_CONNECTION_LIMIT)
    return url.toString()
  } catch {
    return raw
  }
}

const url = databaseUrl()

export const prisma = new PrismaClient(url ? { datasources: { db: { url } } } : undefined)
