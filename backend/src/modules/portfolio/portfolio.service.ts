import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

const SINGLETON_ID = 1

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
  return { data: row.data as unknown as PortfolioContentData, updatedAt: row.updatedAt.toISOString() }
}
