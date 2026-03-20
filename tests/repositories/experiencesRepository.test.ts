import { asc, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { db } from '../../lib/db/client.ts'
import { fetchExperiences } from '../../lib/db/repositories/experiencesRepository.ts'
import {
  education,
  educationI18n,
  experiences,
  experiencesI18n,
} from '../../lib/db/schema.ts'

const buildExpectedExperiences = async (locale: 'it' | 'en') => {
  const baseRows = await db
    .select({
      id: experiences.id,
      orderIndex: experiences.orderIndex,
      logo: experiences.logo,
      logoBg: experiences.logoBg,
    })
    .from(experiences)
    .orderBy(asc(experiences.orderIndex))

  const i18nRows = await db
    .select({
      experienceId: experiencesI18n.experienceId,
      role: experiencesI18n.role,
      company: experiencesI18n.company,
      period: experiencesI18n.period,
      description: experiencesI18n.description,
    })
    .from(experiencesI18n)
    .where(eq(experiencesI18n.locale, locale))

  const textById = new Map(i18nRows.map((row) => [row.experienceId, row]))

  return baseRows
    .map((row) => {
      const i18n = textById.get(row.id)
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
    .filter(Boolean)
}

const buildExpectedEducation = async (locale: 'it' | 'en') => {
  const baseRows = await db
    .select({
      id: education.id,
      orderIndex: education.orderIndex,
      logo: education.logo,
    })
    .from(education)
    .orderBy(asc(education.orderIndex))

  const i18nRows = await db
    .select({
      educationId: educationI18n.educationId,
      degree: educationI18n.degree,
      institution: educationI18n.institution,
      period: educationI18n.period,
      description: educationI18n.description,
    })
    .from(educationI18n)
    .where(eq(educationI18n.locale, locale))

  const textById = new Map(i18nRows.map((row) => [row.educationId, row]))

  return baseRows
    .map((row) => {
      const i18n = textById.get(row.id)
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
    .filter(Boolean)
}

describe('experiencesRepository', () => {
  it('returns a stable italian experiences payload', async () => {
    const response = await fetchExperiences('it')

    expect(response).toEqual(
      expect.objectContaining({
        experiences: expect.any(Array),
        education: expect.any(Array),
      })
    )
    expect(response.experiences[0]).toEqual(
      expect.objectContaining({
        role: expect.any(String),
        company: expect.any(String),
        period: expect.any(String),
        description: expect.any(String),
      })
    )
    expect(response.education[0]).toEqual(
      expect.objectContaining({
        degree: expect.any(String),
        institution: expect.any(String),
        period: expect.any(String),
        description: expect.any(String),
      })
    )
  })

  it('returns a stable english experiences payload', async () => {
    const response = await fetchExperiences('en')

    expect(response).toEqual(
      expect.objectContaining({
        experiences: expect.any(Array),
        education: expect.any(Array),
      })
    )
  })

  it('returns italian experiences aligned with ordered database content', async () => {
    const response = await fetchExperiences('it')
    const expectedExperiences = await buildExpectedExperiences('it')

    expect(response.experiences).toEqual(expectedExperiences)
  })

  it('returns english experiences aligned with ordered localized database content', async () => {
    const response = await fetchExperiences('en')
    const expectedExperiences = await buildExpectedExperiences('en')

    expect(response.experiences).toEqual(expectedExperiences)
  })

  it('returns italian education entries aligned with ordered database content', async () => {
    const response = await fetchExperiences('it')
    const expectedEducation = await buildExpectedEducation('it')

    expect(response.education).toEqual(expectedEducation)
  })

  it('returns english education entries aligned with ordered localized database content', async () => {
    const response = await fetchExperiences('en')
    const expectedEducation = await buildExpectedEducation('en')

    expect(response.education).toEqual(expectedEducation)
  })
})
