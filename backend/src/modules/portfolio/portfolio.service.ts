import type { Prisma } from '@prisma/client'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { prisma } from '../../lib/prisma.js'

const SINGLETON_ID = 1

// Keeps the frontend's bundled fallback (portfolioDefaults.json) in step
// with whatever's actually saved, so a fresh clone or a rebuild without a
// saved DB row still shows current content instead of stale demo data.
// Best-effort only: Vite inlines this file's contents at build time, so this
// write can't change what's already been built/deployed — it just keeps the
// checked-in default current for the *next* build. Silently skipped if the
// path isn't there or isn't writable (e.g. a production filesystem).
const FRONTEND_DEFAULTS_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../frontend/src/pages/Portfolio/portfolioDefaults.json',
)

async function syncFrontendDefaults(data: PortfolioContentData): Promise<void> {
  try {
    await writeFile(FRONTEND_DEFAULTS_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  } catch {
    // Not present in this deployment, or not writable — fine, this is a dev-time convenience only.
  }
}

export interface PortfolioContentData {
  profile: {
    name: string
    title: string
    tagline: string
    location: string
    email: string
    linkedin: string
    website: string
    statusLabel: string
    techHighlights: string[]
    yearsLabel: string
  }
  summaryParagraphs: string[]
  experience: {
    role: string
    company: string
    companyUrl?: string
    dates: string
    location: string
    current: boolean
    bullets: string[]
    tags: string[]
  }[]
  project: {
    name: string
    url: string
    description: string
    note: string
    features: string[]
    stack: string[]
  }
  education: { school: string; degree: string; dates: string }[]
  skillGroups: { label: string; skills: string[] }[]
}

export interface PortfolioContentResult {
  data: PortfolioContentData | null
  updatedAt: string | null
}

export async function getPortfolioContent(): Promise<PortfolioContentResult> {
  const row = await prisma.portfolioContent.findUnique({ where: { id: SINGLETON_ID } })
  if (!row) return { data: null, updatedAt: null }
  return { data: row.data as unknown as PortfolioContentData, updatedAt: row.updatedAt.toISOString() }
}

export async function updatePortfolioContent(
  data: PortfolioContentData,
  updatedBy: string,
): Promise<PortfolioContentResult> {
  const jsonData = data as unknown as Prisma.InputJsonValue
  const row = await prisma.portfolioContent.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, data: jsonData, updatedBy },
    update: { data: jsonData, updatedBy },
  })
  await syncFrontendDefaults(data)
  return { data: row.data as unknown as PortfolioContentData, updatedAt: row.updatedAt.toISOString() }
}
