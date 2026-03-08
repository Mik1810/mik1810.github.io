import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lang = req.query?.lang === 'en' ? 'en' : 'it';
  const cacheKey = `projects:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [
      { data: projectRows, error: projectError },
      { data: i18nRows, error: i18nError },
      { data: tagRows, error: tagError },
    ] = await Promise.all([
      supabaseAdmin
        .from('projects')
        .select('id, slug, order_index, live_url')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('projects_i18n')
        .select('project_id, title, description')
        .eq('locale', lang),
      supabaseAdmin
        .from('project_tags')
        .select('project_id, order_index, tag')
        .order('order_index', { ascending: true }),
    ]);

    if (projectError || i18nError || tagError) {
      console.error('Supabase error:', { projectError, i18nError, tagError });
      return res.status(500).json({ error: 'Database error' });
    }

    const textByProjectId = new Map(
      (i18nRows || []).map((row) => [row.project_id, row])
    );
    const tagsByProjectId = new Map();
    for (const row of tagRows || []) {
      if (!tagsByProjectId.has(row.project_id)) tagsByProjectId.set(row.project_id, []);
      tagsByProjectId.get(row.project_id).push(row.tag);
    }

    const payload = (projectRows || [])
      .map((row) => {
        const i18n = textByProjectId.get(row.id);
        if (!i18n) return null;
        return {
          id: row.id,
          slug: row.slug,
          title: i18n.title,
          description: i18n.description,
          tags: tagsByProjectId.get(row.id) || [],
          live: row.live_url,
        };
      })
      .filter(Boolean);

    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
