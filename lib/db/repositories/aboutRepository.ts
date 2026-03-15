import { asc, eq } from 'drizzle-orm'

import { db } from '../client.js'
import { aboutInterests, aboutInterestsI18n } from '../schema.js'
import type { RepositoryLocale } from './projectsRepository.js'

export interface AboutResponse {
  interests: string[]
}

export const fetchAbout = async (
  locale: RepositoryLocale
): Promise<AboutResponse> => {
  const baseRows = await db
    .select({
      id: aboutInterests.id,
      orderIndex: aboutInterests.orderIndex,
    })
    .from(aboutInterests)
    .orderBy(asc(aboutInterests.orderIndex))

  const i18nRows = await db
    .select({
      aboutInterestId: aboutInterestsI18n.aboutInterestId,
      interest: aboutInterestsI18n.interest,
    })
    .from(aboutInterestsI18n)
    .where(eq(aboutInterestsI18n.locale, locale))

  const labelById = new Map(
    i18nRows.map((row) => [row.aboutInterestId, row.interest || ''])
  )

  return {
    interests: baseRows
      .map((row) => labelById.get(row.id))
      .filter(Boolean) as string[],
  }
}
