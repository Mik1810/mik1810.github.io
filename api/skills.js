import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();
const keyOf = (v) => (v === undefined || v === null ? null : String(v));
const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);

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
    ]);

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
      });
      return res.status(500).json({ error: 'Database error' });
    }

    const techNameById = new Map(
      (techCategoriesI18n || []).map((row) => [
        keyOf(
          pick(
            row.tech_category_id,
            row.category_id,
            row.id_category,
            row.techCategoryId
          )
        ),
        pick(row.name, row.category_name, row.category),
      ])
    );
    const techItemsByCategoryId = new Map();
    for (const row of techItemsRows || []) {
      const categoryId = keyOf(
        pick(row.tech_category_id, row.category_id, row.id_category, row.techCategoryId)
      );
      if (!categoryId) continue;
      if (!techItemsByCategoryId.has(categoryId)) techItemsByCategoryId.set(categoryId, []);
      techItemsByCategoryId.get(categoryId).push({
        name: pick(row.name, row.label, ''),
        devicon: pick(row.devicon, row.icon, ''),
        color: pick(row.color, '#999999'),
      });
    }

    const techStack = (techCategoriesBase || []).map((row) => ({
      category: techNameById.get(keyOf(row.id)) || row.slug || row.name || '',
      items: techItemsByCategoryId.get(keyOf(row.id)) || [],
    }));

    const skillCategoryNameById = new Map(
      (skillCategoriesI18n || []).map((row) => [
        keyOf(
          pick(
            row.skill_category_id,
            row.category_id,
            row.id_category,
            row.skillCategoryId
          )
        ),
        pick(row.category_name, row.name, row.category),
      ])
    );
    const skillItemLabelById = new Map(
      (skillItemsI18n || []).map((row) => [
        keyOf(
          pick(row.skill_item_id, row.item_id, row.id_item, row.skillItemId)
        ),
        pick(row.label, row.name, row.value),
      ])
    );

    const skillItemsByCategoryId = new Map();
    for (const row of skillItemsBase || []) {
      const categoryId = keyOf(
        pick(row.skill_category_id, row.category_id, row.id_category, row.skillCategoryId)
      );
      const label = skillItemLabelById.get(keyOf(row.id));
      if (!categoryId || !label) continue;
      if (!skillItemsByCategoryId.has(categoryId)) {
        skillItemsByCategoryId.set(categoryId, []);
      }
      skillItemsByCategoryId.get(categoryId).push(label);
    }

    const categories = (skillCategoriesBase || []).map((row) => ({
      category: skillCategoryNameById.get(keyOf(row.id)) || `Category ${row.id}`,
      skills: skillItemsByCategoryId.get(keyOf(row.id)) || [],
    }));

    const payload = { techStack, categories };
    if (techStack.length > 0 || categories.length > 0) {
      cache.set(cacheKey, { at: Date.now(), value: payload });
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
