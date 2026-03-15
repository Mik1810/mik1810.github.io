import { asc, eq } from 'drizzle-orm'

import { db } from '../client.js'
import {
  education,
  educationI18n,
  experiences,
  experiencesI18n,
} from '../schema.js'
import type { RepositoryLocale } from './projectsRepository.js'

export interface ExperienceSummary {
  id: number
  order_index: number | null
  logo: string | null
  logo_bg: string | null
  role: string
  company: string
  period: string
  description: string
}

export interface EducationSummary {
  id: number
  order_index: number | null
  logo: string | null
  degree: string
  institution: string
  period: string
  description: string
}

export interface ExperiencesResponse {
  experiences: ExperienceSummary[]
  education: EducationSummary[]
}

export const fetchExperiences = async (
  locale: RepositoryLocale
): Promise<ExperiencesResponse> => {
  const experienceRows = await db
    .select({
      id: experiences.id,
      orderIndex: experiences.orderIndex,
      logo: experiences.logo,
      logoBg: experiences.logoBg,
    })
    .from(experiences)
    .orderBy(asc(experiences.orderIndex))

  const experienceI18nRows = await db
    .select({
      experienceId: experiencesI18n.experienceId,
      role: experiencesI18n.role,
      company: experiencesI18n.company,
      period: experiencesI18n.period,
      description: experiencesI18n.description,
    })
    .from(experiencesI18n)
    .where(eq(experiencesI18n.locale, locale))

  const educationRows = await db
    .select({
      id: education.id,
      orderIndex: education.orderIndex,
      logo: education.logo,
    })
    .from(education)
    .orderBy(asc(education.orderIndex))

  const educationI18nRows = await db
    .select({
      educationId: educationI18n.educationId,
      degree: educationI18n.degree,
      institution: educationI18n.institution,
      period: educationI18n.period,
      description: educationI18n.description,
    })
    .from(educationI18n)
    .where(eq(educationI18n.locale, locale))

  const experienceTextById = new Map(
    experienceI18nRows.map((row) => [row.experienceId, row])
  )
  const educationTextById = new Map(
    educationI18nRows.map((row) => [row.educationId, row])
  )

  const experienceList = experienceRows
    .map((row) => {
      const i18n = experienceTextById.get(row.id)
      if (!i18n) return null
      return {
        id: row.id,
        order_index: row.orderIndex ?? null,
        logo: row.logo ?? null,
        logo_bg: row.logoBg ?? null,
        role: i18n.role || '',
        company: i18n.company || '',
        period: i18n.period || '',
        description: i18n.description || '',
      }
    })
    .filter(Boolean) as ExperienceSummary[]

  const educationList = educationRows
    .map((row) => {
      const i18n = educationTextById.get(row.id)
      if (!i18n) return null
      return {
        id: row.id,
        order_index: row.orderIndex ?? null,
        logo: row.logo ?? null,
        degree: i18n.degree || '',
        institution: i18n.institution || '',
        period: i18n.period || '',
        description: i18n.description || '',
      }
    })
    .filter(Boolean) as EducationSummary[]

  return { experiences: experienceList, education: educationList }
}
