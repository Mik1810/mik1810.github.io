import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const keyOf = (v) => (v === undefined || v === null ? null : String(v));

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
        .select('id, slug, order_index, live_url'),
      supabaseAdmin
        .from('projects_i18n')
        .select('project_id, title, description')
        .eq('locale', lang),
      supabaseAdmin
        .from('project_tags')
        .select('project_id, order_index, tag'),
    ]);

    if (projectError || i18nError || tagError) {
      console.error('Supabase error:', {
        projectError,
        i18nError,
        tagError,
      });
      return res.status(500).json({ error: 'Database error' });
    }

    const textByProjectId = new Map();
    for (const row of i18nRows || []) {
      const id = keyOf(row.project_id);
      if (id) textByProjectId.set(id, row);
    }
    const tagsByProjectId = new Map();
    const sortedTags = (tagRows || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0));
    for (const row of sortedTags) {
      const projectId = keyOf(row.project_id);
      if (!projectId) continue;
      if (!tagsByProjectId.has(projectId)) tagsByProjectId.set(projectId, []);
      tagsByProjectId.get(projectId).push(row.tag ?? row.name ?? '');
    }

    const sortedProjects = (projectRows || [])
      .slice()
      .sort((a, b) => (a.order_index ?? a.id ?? 0) - (b.order_index ?? b.id ?? 0));

    let payload = sortedProjects
      .map((row) => {
        const rowKey = keyOf(row.id);
        const i18n = textByProjectId.get(rowKey);
        return {
          id: row.id,
          slug: row.slug ?? `project-${row.id}`,
          title: i18n?.title ?? '',
          description: i18n?.description ?? '',
          tags: tagsByProjectId.get(rowKey) || [],
          live: row.live_url ?? row.live ?? null,
          github: null,
        };
      });

    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
