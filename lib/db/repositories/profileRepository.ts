import { and, asc, eq } from 'drizzle-orm'

import { db } from '../client.js'
import {
  heroRoles,
  heroRolesI18n,
  profile,
  profileI18n,
  socialLinks,
} from '../schema.js'
import {
  normalizeRepositoryLocale,
  type RepositoryLocale,
} from './projectsRepository.js'

export interface ProfileResponse {
  name: string
  photo: string
  email: string
  cv: string
  greeting: string
  location: string
  bio: string
  university: {
    name: string
    logo: string
  }
  roles: string[]
  socials: Array<{
    name: string
    url: string
    icon: string
  }>
}

export { normalizeRepositoryLocale }

export const fetchProfile = async (
  locale: RepositoryLocale
): Promise<ProfileResponse> => {
  const profileRows = await db
    .select({
      id: profile.id,
      fullName: profile.fullName,
      photoUrl: profile.photoUrl,
      email: profile.email,
      cvUrl: profile.cvUrl,
      universityLogoUrl: profile.universityLogoUrl,
    })
    .from(profile)
    .where(eq(profile.id, 1))
    .limit(1)

  const profileI18nRows = await db
    .select({
      locale: profileI18n.locale,
      greeting: profileI18n.greeting,
      location: profileI18n.location,
      universityName: profileI18n.universityName,
      bio: profileI18n.bio,
    })
    .from(profileI18n)
    .where(and(eq(profileI18n.profileId, 1), eq(profileI18n.locale, locale)))
    .limit(1)

  const socialRows = await db
    .select({
      orderIndex: socialLinks.orderIndex,
      name: socialLinks.name,
      url: socialLinks.url,
      iconKey: socialLinks.iconKey,
    })
    .from(socialLinks)
    .where(eq(socialLinks.profileId, 1))
    .orderBy(asc(socialLinks.orderIndex))

  const roleBaseRows = await db
    .select({
      id: heroRoles.id,
      orderIndex: heroRoles.orderIndex,
    })
    .from(heroRoles)
    .orderBy(asc(heroRoles.orderIndex))

  const roleI18nRows = await db
    .select({
      heroRoleId: heroRolesI18n.heroRoleId,
      role: heroRolesI18n.role,
    })
    .from(heroRolesI18n)
    .where(eq(heroRolesI18n.locale, locale))

  const profileRow = profileRows[0] || null
  const profileI18nRow = profileI18nRows[0] || null

  const roleById = new Map(
    roleI18nRows.map((row) => [row.heroRoleId, row.role || ''])
  )
  const roles = roleBaseRows
    .map((row) => roleById.get(row.id))
    .filter(Boolean) as string[]

  return {
    name: profileRow?.fullName || '',
    photo: profileRow?.photoUrl || '',
    email: profileRow?.email || '',
    cv: profileRow?.cvUrl || '',
    greeting: profileI18nRow?.greeting || '',
    location: profileI18nRow?.location || '',
    bio: profileI18nRow?.bio || '',
    university: {
      name: profileI18nRow?.universityName || '',
      logo: profileRow?.universityLogoUrl || '',
    },
    roles,
    socials: socialRows.map((row) => ({
      name: row.name || '',
      url: row.url || '',
      icon: row.iconKey || '',
    })),
  }
}
