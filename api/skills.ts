import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import type { ApiHandler } from '../lib/types/http.js'

const CACHE_TTL_MS = 60 * 1000

type Locale = 'it' | 'en'

interface TechCategoryBaseRow {
  id: number | string
  order_index?: number | null
  slug?: string | null
  name?: string | null
}

interface TechCategoryI18nRow {
  tech_category_id?: number | string | null
  category_id?: number | string | null
  id_category?: number | string | null
  techCategoryId?: number | string | null
  name?: string | null
  category_name?: string | null
  category?: string | null
}

interface TechItemRow {
  id: number | string
  tech_category_id?: number | string | null
  category_id?: number | string | null
  id_category?: number | string | null
  techCategoryId?: number | string | null
  order_index?: number | null
  name?: string | null
  label?: string | null
  devicon?: string | null
  icon?: string | null
  color?: string | null
}

interface SkillCategoryBaseRow {
  id: number | string
  order_index?: number | null
}

interface SkillCategoryI18nRow {
  skill_category_id?: number | string | null
  category_id?: number | string | null
  id_category?: number | string | null
  skillCategoryId?: number | string | null
  category_name?: string | null
  name?: string | null
  category?: string | null
}

interface SkillItemBaseRow {
  id: number | string
  skill_category_id?: number | string | null
  category_id?: number | string | null
  id_category?: number | string | null
  skillCategoryId?: number | string | null
}

interface SkillItemI18nRow {
  skill_item_id?: number | string | null
  item_id?: number | string | null
  id_item?: number | string | null
  skillItemId?: number | string | null
  label?: string | null
  name?: string | null
  value?: string | null
}

interface SkillsResponse {
  techStack: Array<{
    category: string
    items: Array<{
      name: string
      devicon: string
      color: string
    }>
  }>
  categories: Array<{
    category: string
    skills: string[]
  }>
}

const cache = new Map<string, { at: number; value: SkillsResponse }>()

const keyOf = (value: unknown) =>
  value === undefined || value === null ? null : String(value)

const pick = <T>(...values: Array<T | undefined | null>) =>
  values.find((value) => value !== undefined && value !== null)

const normalizeLocale = (value: string | undefined): Locale =>
  value === 'en' ? 'en' : 'it'

const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const lang = normalizeLocale(req.query?.lang)
  const cacheKey = `skills:${lang}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(cached.value)
  }

  try {
    const [
      { data: techCategoriesBase, error: techCategoriesError },
      { data: techCategoriesI18n, error: techCategoriesI18nError },
      { data: techItemsRows, error: techItemsError },
      { data: skillCategoriesBase, error: skillCategoriesError },
      { data: skillCategoriesI18n, error: skillCategoriesI18nError },
      { data: skillItemsBase, error: skillItemsError },
      { data: skillItemsI18n, error: skillItemsI18nError },
    ] = await Promise.all([
      supabaseAdmin
        .from('tech_categories')
        .select('id, order_index, slug')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('tech_categories_i18n')
        .select('tech_category_id, name')
        .eq('locale', lang),
      supabaseAdmin
        .from('tech_items')
        .select('id, tech_category_id, order_index, name, devicon, color')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('skill_categories')
        .select('id, order_index')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('skill_categories_i18n')
        .select('skill_category_id, category_name')
        .eq('locale', lang),
      supabaseAdmin
        .from('skill_items')
        .select('id, skill_category_id, order_index')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('skill_items_i18n')
        .select('skill_item_id, label')
        .eq('locale', lang),
    ])

    if (
      techCategoriesError ||
      techCategoriesI18nError ||
      techItemsError ||
      skillCategoriesError ||
      skillCategoriesI18nError ||
      skillItemsError ||
      skillItemsI18nError
    ) {
      console.error('Supabase error:', {
        techCategoriesError,
        techCategoriesI18nError,
        techItemsError,
        skillCategoriesError,
        skillCategoriesI18nError,
        skillItemsError,
        skillItemsI18nError,
      })
      return res.status(500).json({ error: 'Database error' })
    }

    const techNameById = new Map(
      ((techCategoriesI18n || []) as TechCategoryI18nRow[]).map((row) => [
        keyOf(
          pick(
            row.tech_category_id,
            row.category_id,
            row.id_category,
            row.techCategoryId
          )
        ),
        pick(row.name, row.category_name, row.category, '') || '',
      ])
    )

    const techItemsByCategoryId = new Map<
      string,
      Array<{ name: string; devicon: string; color: string }>
    >()
    for (const row of (techItemsRows || []) as TechItemRow[]) {
      const categoryId = keyOf(
        pick(
          row.tech_category_id,
          row.category_id,
          row.id_category,
          row.techCategoryId
        )
      )
      if (!categoryId) continue
      if (!techItemsByCategoryId.has(categoryId)) {
        techItemsByCategoryId.set(categoryId, [])
      }
      techItemsByCategoryId.get(categoryId)?.push({
        name: pick(row.name, row.label, '') || '',
        devicon: pick(row.devicon, row.icon, '') || '',
        color: pick(row.color, '#999999') || '#999999',
      })
    }

    const techStack = ((techCategoriesBase || []) as TechCategoryBaseRow[]).map(
      (row) => ({
        category: techNameById.get(keyOf(row.id)) || row.slug || row.name || '',
        items: techItemsByCategoryId.get(keyOf(row.id) || '') || [],
      })
    )

    const skillCategoryNameById = new Map(
      ((skillCategoriesI18n || []) as SkillCategoryI18nRow[]).map((row) => [
        keyOf(
          pick(
            row.skill_category_id,
            row.category_id,
            row.id_category,
            row.skillCategoryId
          )
        ),
        pick(row.category_name, row.name, row.category, '') || '',
      ])
    )

    const skillItemLabelById = new Map(
      ((skillItemsI18n || []) as SkillItemI18nRow[]).map((row) => [
        keyOf(
          pick(row.skill_item_id, row.item_id, row.id_item, row.skillItemId)
        ),
        pick(row.label, row.name, row.value, '') || '',
      ])
    )

    const skillItemsByCategoryId = new Map<string, string[]>()
    for (const row of (skillItemsBase || []) as SkillItemBaseRow[]) {
      const categoryId = keyOf(
        pick(
          row.skill_category_id,
          row.category_id,
          row.id_category,
          row.skillCategoryId
        )
      )
      const label = skillItemLabelById.get(keyOf(row.id))
      if (!categoryId || !label) continue
      if (!skillItemsByCategoryId.has(categoryId)) {
        skillItemsByCategoryId.set(categoryId, [])
      }
      skillItemsByCategoryId.get(categoryId)?.push(label)
    }

    const categories = ((skillCategoriesBase || []) as SkillCategoryBaseRow[]).map(
      (row) => ({
        category:
          skillCategoryNameById.get(keyOf(row.id)) || `Category ${row.id}`,
        skills: skillItemsByCategoryId.get(keyOf(row.id) || '') || [],
      })
    )

    const payload: SkillsResponse = { techStack, categories }
    if (techStack.length > 0 || categories.length > 0) {
      cache.set(cacheKey, { at: Date.now(), value: payload })
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(payload)
  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
