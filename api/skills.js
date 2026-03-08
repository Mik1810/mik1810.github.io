import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();
const keyOf = (v) => (v === undefined || v === null ? null : String(v));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lang = req.query?.lang === 'en' ? 'en' : 'it';
  const cacheKey = `skills:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [
      { data: techBaseRows, error: techBaseError },
      { data: techI18nRows, error: techI18nError },
      { data: techItemRows, error: techItemError },
      { data: skillCategoryBaseRows, error: skillCategoryBaseError },
      { data: skillCategoryI18nRows, error: skillCategoryI18nError },
      { data: skillItemBaseRows, error: skillItemBaseError },
      { data: skillItemI18nRows, error: skillItemI18nError },
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
    ]);

    if (
      techBaseError ||
      techI18nError ||
      techItemError ||
      skillCategoryBaseError ||
      skillCategoryI18nError ||
      skillItemBaseError ||
      skillItemI18nError
    ) {
      console.error('Supabase error:', {
        techBaseError,
        techI18nError,
        techItemError,
        skillCategoryBaseError,
        skillCategoryI18nError,
        skillItemBaseError,
        skillItemI18nError,
      });
      return res.status(500).json({ error: 'Database error' });
    }

    const techNameById = new Map(
      (techI18nRows || []).map((r) => [keyOf(r.tech_category_id), r.name])
    );
    const techItemsByCategoryId = new Map();
    for (const row of techItemRows || []) {
      const categoryId = keyOf(row.tech_category_id);
      if (!categoryId) continue;
      if (!techItemsByCategoryId.has(categoryId)) techItemsByCategoryId.set(categoryId, []);
      techItemsByCategoryId.get(categoryId).push({
        name: row.name,
        devicon: row.devicon,
        color: row.color,
      });
    }

    const techStack = (techBaseRows || []).map((row) => ({
      category: techNameById.get(keyOf(row.id)) || row.slug || '',
      items: techItemsByCategoryId.get(keyOf(row.id)) || [],
    }));

    const skillCategoryNameById = new Map(
      (skillCategoryI18nRows || []).map((r) => [
        keyOf(r.skill_category_id),
        r.category_name,
      ])
    );
    const skillItemLabelById = new Map(
      (skillItemI18nRows || []).map((r) => [keyOf(r.skill_item_id), r.label])
    );

    const skillItemsByCategoryId = new Map();
    for (const row of skillItemBaseRows || []) {
      const categoryId = keyOf(row.skill_category_id);
      const label = skillItemLabelById.get(keyOf(row.id));
      if (!categoryId || !label) continue;
      if (!skillItemsByCategoryId.has(categoryId)) {
        skillItemsByCategoryId.set(categoryId, []);
      }
      skillItemsByCategoryId.get(categoryId).push(label);
    }

    const categories = (skillCategoryBaseRows || []).map((row) => ({
      category: skillCategoryNameById.get(keyOf(row.id)) || `Category ${row.id}`,
      skills: skillItemsByCategoryId.get(keyOf(row.id)) || [],
    }));

    const payload = { techStack, categories };
    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
