import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import type { ApiHandler } from '../lib/types/http.js'

const CACHE_TTL_MS = 60 * 1000

type Locale = 'it' | 'en'

interface ExperienceBaseRow {
  id: number
  order_index?: number | null
  logo?: string | null
  logo_bg?: string | null
}

interface ExperienceI18nRow {
  experience_id: number
  role?: string | null
  company?: string | null
  period?: string | null
  description?: string | null
}

interface EducationBaseRow {
  id: number
  order_index?: number | null
  logo?: string | null
}

interface EducationI18nRow {
  education_id: number
  degree?: string | null
  institution?: string | null
  period?: string | null
  description?: string | null
}

interface ExperienceSummary {
  id: number
  order_index: number | null
  logo: string | null
  logo_bg: string | null
  role: string
  company: string
  period: string
  description: string
}

interface EducationSummary {
  id: number
  order_index: number | null
  logo: string | null
  degree: string
  institution: string
  period: string
  description: string
}

interface ExperiencesResponse {
  experiences: ExperienceSummary[]
  education: EducationSummary[]
}

const cache = new Map<string, { at: number; value: ExperiencesResponse }>()

const normalizeLocale = (value: string | undefined): Locale =>
  value === 'en' ? 'en' : 'it'

const handler: ApiHandler = async (req, res) => {
  const lang = normalizeLocale(req.query?.lang)
  const cacheKey = `experiences:${lang}`

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(cached.value)
  }

  try {
    const [
      { data: experiencesBase, error: experiencesError },
      { data: experiencesI18n, error: experiencesI18nError },
      { data: educationBase, error: educationError },
      { data: educationI18n, error: educationI18nError },
    ] = await Promise.all([
      supabaseAdmin
        .from('experiences')
        .select('id, order_index, logo, logo_bg')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('experiences_i18n')
        .select('experience_id, role, company, period, description')
        .eq('locale', lang),
      supabaseAdmin
        .from('education')
        .select('id, order_index, logo')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('education_i18n')
        .select('education_id, degree, institution, period, description')
        .eq('locale', lang),
    ])

    if (
      experiencesError ||
      experiencesI18nError ||
      educationError ||
      educationI18nError
    ) {
      console.error('Supabase error:', {
        experiencesError,
        experiencesI18nError,
        educationError,
        educationI18nError,
      })
      return res.status(500).json({
        error: 'Database error',
      })
    }

    const experienceTextById = new Map(
      ((experiencesI18n || []) as ExperienceI18nRow[]).map((row) => [
        row.experience_id,
        row,
      ])
    )
    const educationTextById = new Map(
      ((educationI18n || []) as EducationI18nRow[]).map((row) => [
        row.education_id,
        row,
      ])
    )

    const experiences = ((experiencesBase || []) as ExperienceBaseRow[])
      .map((row) => {
        const i18n = experienceTextById.get(row.id)
        if (!i18n) return null
        return {
          id: row.id,
          order_index: row.order_index ?? null,
          logo: row.logo ?? null,
          logo_bg: row.logo_bg ?? null,
          role: i18n.role || '',
          company: i18n.company || '',
          period: i18n.period || '',
          description: i18n.description || '',
        }
      })
      .filter(Boolean) as ExperienceSummary[]

    const education = ((educationBase || []) as EducationBaseRow[])
      .map((row) => {
        const i18n = educationTextById.get(row.id)
        if (!i18n) return null
        return {
          id: row.id,
          order_index: row.order_index ?? null,
          logo: row.logo ?? null,
          degree: i18n.degree || '',
          institution: i18n.institution || '',
          period: i18n.period || '',
          description: i18n.description || '',
        }
      })
      .filter(Boolean) as EducationSummary[]

    const payload: ExperiencesResponse = {
      experiences,
      education,
    }
    cache.set(cacheKey, { at: Date.now(), value: payload })

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(payload)
  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({
      error: 'Internal server error',
    })
  }
}

export default handler
