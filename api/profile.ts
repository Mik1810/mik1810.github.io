import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import type { ApiHandler } from '../lib/types/http.js'

const CACHE_TTL_MS = 60 * 1000

type Locale = 'it' | 'en'

interface ProfileRow {
  id: number
  full_name?: string | null
  photo_url?: string | null
  email?: string | null
  cv_url?: string | null
  university_logo_url?: string | null
}

interface ProfileI18nRow {
  locale?: Locale
  greeting?: string | null
  location?: string | null
  university_name?: string | null
  bio?: string | null
}

interface SocialRow {
  order_index?: number | null
  name?: string | null
  url?: string | null
  icon_key?: string | null
}

interface HeroRoleBaseRow {
  id: number
  order_index?: number | null
}

interface HeroRoleI18nRow {
  hero_role_id: number
  role?: string | null
}

interface ProfileResponse {
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

const cache = new Map<string, { at: number; value: ProfileResponse }>()

const normalizeLocale = (value: string | undefined): Locale =>
  value === 'en' ? 'en' : 'it'

const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const lang = normalizeLocale(req.query?.lang)
  const cacheKey = `profile:${lang}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(cached.value)
  }

  try {
    const [
      { data: profileRow, error: profileError },
      profileI18nResult,
      { data: socialRows, error: socialError },
      { data: roleBaseRows, error: roleBaseError },
      { data: roleI18nRows, error: roleI18nError },
    ] = await Promise.all([
      supabaseAdmin
        .from('profile')
        .select('id, full_name, photo_url, email, cv_url, university_logo_url')
        .eq('id', 1)
        .single(),
      supabaseAdmin
        .from('profile_i18n')
        .select('locale, greeting, location, university_name, bio')
        .eq('profile_id', 1)
        .eq('locale', lang),
      supabaseAdmin
        .from('social_links')
        .select('order_index, name, url, icon_key')
        .eq('profile_id', 1)
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('hero_roles')
        .select('id, order_index')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('hero_roles_i18n')
        .select('hero_role_id, role')
        .eq('locale', lang),
    ])

    let profileI18nRows = profileI18nResult.data as ProfileI18nRow[] | null
    let profileI18nError = profileI18nResult.error

    // Backward compatibility if `bio` column is not present yet.
    if (profileI18nError?.code === '42703') {
      const fallback = await supabaseAdmin
        .from('profile_i18n')
        .select('locale, greeting, location, university_name')
        .eq('profile_id', 1)
        .eq('locale', lang)
      profileI18nRows = fallback.data as ProfileI18nRow[] | null
      profileI18nError = fallback.error
    }

    if (
      profileError ||
      profileI18nError ||
      socialError ||
      roleBaseError ||
      roleI18nError
    ) {
      console.error('Supabase error:', {
        profileError,
        profileI18nError,
        socialError,
        roleBaseError,
        roleI18nError,
      })
      return res.status(500).json({ error: 'Database error' })
    }

    const profile = profileRow as ProfileRow | null
    const profileI18n = (profileI18nRows || [])[0] || {}
    const roleById = new Map(
      ((roleI18nRows || []) as HeroRoleI18nRow[]).map((row) => [
        row.hero_role_id,
        row.role || '',
      ])
    )
    const roles = ((roleBaseRows || []) as HeroRoleBaseRow[])
      .map((row) => roleById.get(row.id))
      .filter(Boolean) as string[]

    const payload: ProfileResponse = {
      name: profile?.full_name || '',
      photo: profile?.photo_url || '',
      email: profile?.email || '',
      cv: profile?.cv_url || '',
      greeting: profileI18n.greeting || '',
      location: profileI18n.location || '',
      bio: profileI18n.bio || '',
      university: {
        name: profileI18n.university_name || '',
        logo: profile?.university_logo_url || '',
      },
      roles,
      socials: ((socialRows || []) as SocialRow[]).map((row) => ({
        name: row.name || '',
        url: row.url || '',
        icon: row.icon_key || '',
      })),
    }

    cache.set(cacheKey, { at: Date.now(), value: payload })
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(payload)
  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
