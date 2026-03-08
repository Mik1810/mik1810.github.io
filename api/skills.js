import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

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
        .select('*'),
      supabaseAdmin
        .from('tech_categories_i18n')
        .select('*')
        .eq('locale', lang),
      supabaseAdmin
        .from('tech_items')
        .select('*'),
      supabaseAdmin
        .from('skill_categories')
        .select('*'),
      supabaseAdmin
        .from('skill_categories_i18n')
        .select('*')
        .eq('locale', lang),
      supabaseAdmin
        .from('skill_items')
        .select('*'),
      supabaseAdmin
        .from('skill_items_i18n')
        .select('*')
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
      (techI18nRows || []).map((row) => [
        row.tech_category_id ?? row.category_id ?? row.techCategoryId,
        row.name ?? row.category_name ?? row.category,
      ])
    );
    const techItemsByCategoryId = new Map();
    const sortedTechItems = (techItemRows || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0));
    for (const row of sortedTechItems) {
      const categoryId =
        row.tech_category_id ?? row.category_id ?? row.techCategoryId;
      if (!categoryId) continue;
      if (!techItemsByCategoryId.has(categoryId)) {
        techItemsByCategoryId.set(categoryId, []);
      }
      techItemsByCategoryId.get(categoryId).push({
        name: row.name,
        devicon: row.devicon,
        color: row.color,
      });
    }

    const techStack = (techBaseRows || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0))
      .map((row) => ({
        category: techNameById.get(row.id) || row.name || '',
        items: techItemsByCategoryId.get(row.id) || [],
      }))
      .filter((row) => row.category);

    const skillCategoryNameById = new Map(
      (skillCategoryI18nRows || []).map((row) => [
        row.skill_category_id ?? row.category_id ?? row.skillCategoryId,
        row.category_name ?? row.category ?? row.name,
      ])
    );
    const skillItemLabelById = new Map(
      (skillItemI18nRows || []).map((row) => [
        row.skill_item_id ?? row.item_id ?? row.skillItemId,
        row.label ?? row.name,
      ])
    );
    const skillItemsByCategoryId = new Map();
    const sortedSkillItems = (skillItemBaseRows || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0));
    for (const row of sortedSkillItems) {
      const categoryId =
        row.skill_category_id ?? row.category_id ?? row.skillCategoryId;
      const label = skillItemLabelById.get(row.id);
      if (!categoryId || !label) continue;
      if (!skillItemsByCategoryId.has(categoryId)) {
        skillItemsByCategoryId.set(categoryId, []);
      }
      skillItemsByCategoryId.get(categoryId).push(label);
    }

    const categories = (skillCategoryBaseRows || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0))
      .map((row) => ({
        category: skillCategoryNameById.get(row.id) || row.name || '',
        skills: skillItemsByCategoryId.get(row.id) || [],
      }))
      .filter((row) => row.category);

    const payload = {
      techStack,
      categories,
    };

    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
