import { and, asc, eq, notLike } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { db } from '../../lib/db/client.ts'
import {
  fetchProfile,
  normalizeRepositoryLocale,
} from '../../lib/db/repositories/profileRepository.ts'
import {
  heroRoles,
  heroRolesI18n,
  socialLinks,
} from '../../lib/db/schema.ts'

describe('profileRepository', () => {
  it('normalizes unsupported locales back to italian', () => {
    expect(normalizeRepositoryLocale('it')).toBe('it')
    expect(normalizeRepositoryLocale('en')).toBe('en')
    expect(normalizeRepositoryLocale('fr')).toBe('it')
    expect(normalizeRepositoryLocale(undefined)).toBe('it')
  })

  it('returns a stable italian profile payload', async () => {
    const profile = await fetchProfile('it')

    expect(profile).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        photo: expect.any(String),
        email: expect.any(String),
        cv: expect.any(String),
        greeting: expect.any(String),
        location: expect.any(String),
        bio: expect.any(String),
        university: expect.objectContaining({
          name: expect.any(String),
          logo: expect.any(String),
        }),
        roles: expect.any(Array),
        socials: expect.any(Array),
      })
    )
  })

  it('returns a stable english profile payload', async () => {
    const profile = await fetchProfile('en')

    expect(profile).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        greeting: expect.any(String),
        location: expect.any(String),
        university: expect.objectContaining({
          name: expect.any(String),
        }),
        roles: expect.any(Array),
        socials: expect.any(Array),
      })
    )
  })

  it('keeps social links ordered by order_index', async () => {
    const profile = await fetchProfile('it')

    const socialRows = await db
      .select({
        name: socialLinks.name,
        url: socialLinks.url,
        iconKey: socialLinks.iconKey,
      })
      .from(socialLinks)
      .where(
        and(
          eq(socialLinks.profileId, 1),
          notLike(socialLinks.url, 'https://example.com/%')
        )
      )
      .orderBy(asc(socialLinks.orderIndex))

    expect(
      profile.socials.filter(
        (row) => !row.url.startsWith('https://example.com/')
      )
    ).toEqual(
      socialRows.map((row) => ({
        name: row.name || '',
        url: row.url || '',
        icon: row.iconKey || '',
      }))
    )
  })

  it('returns role strings aligned with the selected locale', async () => {
    const italianProfile = await fetchProfile('it')
    const englishProfile = await fetchProfile('en')

    const italianRoleRows = await db
      .select({
        id: heroRoles.id,
        role: heroRolesI18n.role,
      })
      .from(heroRoles)
      .leftJoin(
        heroRolesI18n,
        and(eq(heroRolesI18n.heroRoleId, heroRoles.id), eq(heroRolesI18n.locale, 'it'))
      )
      .orderBy(asc(heroRoles.orderIndex))

    const englishRoleRows = await db
      .select({
        id: heroRoles.id,
        role: heroRolesI18n.role,
      })
      .from(heroRoles)
      .leftJoin(
        heroRolesI18n,
        and(eq(heroRolesI18n.heroRoleId, heroRoles.id), eq(heroRolesI18n.locale, 'en'))
      )
      .orderBy(asc(heroRoles.orderIndex))

    expect(italianProfile.roles).toEqual(
      italianRoleRows.map((row) => row.role).filter(Boolean)
    )
    expect(englishProfile.roles).toEqual(
      englishRoleRows.map((row) => row.role).filter(Boolean)
    )
  })
})
