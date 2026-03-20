import { asc, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { db } from '../../lib/db/client.ts'
import { fetchAbout } from '../../lib/db/repositories/aboutRepository.ts'
import {
  aboutInterests,
  aboutInterestsI18n,
} from '../../lib/db/schema.ts'

const buildExpectedInterests = async (locale: 'it' | 'en') => {
  const baseRows = await db
    .select({
      id: aboutInterests.id,
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

  return baseRows
    .map((row) => labelById.get(row.id))
    .filter(Boolean) as string[]
}

describe('aboutRepository', () => {
  it('returns a stable italian about payload', async () => {
    const response = await fetchAbout('it')

    expect(response).toEqual(
      expect.objectContaining({
        interests: expect.any(Array),
      })
    )
  })

  it('returns a stable english about payload', async () => {
    const response = await fetchAbout('en')

    expect(response).toEqual(
      expect.objectContaining({
        interests: expect.any(Array),
      })
    )
  })

  it('returns italian interests aligned with the ordered database content', async () => {
    const response = await fetchAbout('it')
    const expectedInterests = await buildExpectedInterests('it')

    expect(response.interests).toEqual(expectedInterests)
  })

  it('returns english interests aligned with the ordered database content', async () => {
    const response = await fetchAbout('en')
    const expectedInterests = await buildExpectedInterests('en')

    expect(response.interests).toEqual(expectedInterests)
  })
})
