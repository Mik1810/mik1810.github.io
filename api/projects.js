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
  const cacheKey = `projects:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [
      { data: projectsBase, error: projectsError },
      { data: i18nRows, error: i18nError },
      { data: tagsRows, error: tagsError },
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

    if (projectsError || i18nError || tagsError) {
      console.error('Supabase error:', {
        projectsError,
        i18nError,
        tagsError,
      });
      return res.status(500).json({ error: 'Database error' });
    }

    const textByProjectId = new Map(
      (i18nRows || []).map((row) => [
        keyOf(pick(row.project_id, row.projects_id, row.id_project, row.projectId)),
        row,
      ])
    );
    const tagsByProjectId = new Map();
    for (const row of tagsRows || []) {
      const projectId = keyOf(
        pick(row.project_id, row.projects_id, row.id_project, row.projectId)
      );
      if (!projectId) continue;
      if (!tagsByProjectId.has(projectId)) tagsByProjectId.set(projectId, []);
      tagsByProjectId.get(projectId).push(pick(row.tag, row.name, row.value, ''));
    }

    const payload = (projectsBase || [])
      .map((row) => {
        const rowKey = keyOf(row.id);
        const i18n = textByProjectId.get(rowKey);
        return {
          id: row.id,
          slug: row.slug || `project-${row.id}`,
          title: i18n?.title || '',
          description: i18n?.description || '',
          tags: tagsByProjectId.get(rowKey) || [],
          live: row.live_url || null,
          github: null,
        };
      });

    if (payload.length > 0 && payload.some((p) => p.title)) {
      cache.set(cacheKey, { at: Date.now(), value: payload });
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
