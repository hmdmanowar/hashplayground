import { request } from '../lib/apiClient'

export interface PortfolioProfile {
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

export interface PortfolioExperienceEntry {
  role: string
  company: string
  companyUrl?: string
  dates: string
  location: string
  current: boolean
  bullets: string[]
  tags: string[]
}

export interface PortfolioProject {
  name: string
  url: string
  description: string
  note: string
  features: string[]
  stack: string[]
}

export interface PortfolioEducationEntry {
  school: string
  degree: string
  dates: string
}

export interface PortfolioSkillGroup {
  label: string
  skills: string[]
}

export interface PortfolioContentData {
  profile: PortfolioProfile
  summaryParagraphs: string[]
  experience: PortfolioExperienceEntry[]
  project: PortfolioProject
  education: PortfolioEducationEntry[]
  skillGroups: PortfolioSkillGroup[]
}

export interface PortfolioContentResult {
  data: PortfolioContentData | null
  updatedAt: string | null
}

export async function getPortfolioContent(): Promise<PortfolioContentResult> {
  return request<PortfolioContentResult>('/portfolio')
}

export async function updatePortfolioContent(data: PortfolioContentData): Promise<PortfolioContentResult> {
  return request<PortfolioContentResult>('/portfolio', { method: 'PATCH', body: data })
}
