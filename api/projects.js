import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const keyOf = (v) => (v === undefined || v === null ? null : String(v));
const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);
const isMissingRelationError = (error) =>
  error?.code === 'PGRST205' ||
  error?.code === '42P01' ||
  /could not find the table|relation .* does not exist/i.test(error?.message || '');

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
      { data: githubBase, error: githubBaseError },
      { data: githubI18nRows, error: githubI18nError },
      { data: githubTagsRows, error: githubTagsError },
      { data: githubImagesRows, error: githubImagesError },
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
      supabaseAdmin
        .from('github_projects')
        .select('id, slug, order_index, github_url, live_url, image_url, featured')
        .eq('featured', true)
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('github_projects_i18n')
        .select('github_project_id, title, description')
        .eq('locale', lang),
      supabaseAdmin
        .from('github_project_tags')
        .select('github_project_id, order_index, tag')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('github_project_images')
        .select('github_project_id, order_index, image_url, alt_text')
        .order('order_index', { ascending: true }),
    ]);

    const githubImagesMissing = isMissingRelationError(githubImagesError);

    if (
      projectsError ||
      i18nError ||
      tagsError ||
      githubBaseError ||
      githubI18nError ||
      githubTagsError ||
      (githubImagesError && !githubImagesMissing)
    ) {
      console.error('Supabase error:', {
        projectsError,
        i18nError,
        tagsError,
        githubBaseError,
        githubI18nError,
        githubTagsError,
        githubImagesError,
      });
      return res.status(500).json({ error: 'Database error' });
    }

    if (githubImagesMissing) {
      console.warn('github_project_images table not found, falling back to image_url previews');
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

    const projects = (projectsBase || [])
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

    const githubTextByProjectId = new Map(
      (githubI18nRows || []).map((row) => [
        keyOf(
          pick(
            row.github_project_id,
            row.github_projects_id,
            row.id_github_project,
            row.githubProjectId
          )
        ),
        row,
      ])
    );
    const githubTagsByProjectId = new Map();
    for (const row of githubTagsRows || []) {
      const projectId = keyOf(
        pick(
          row.github_project_id,
          row.github_projects_id,
          row.id_github_project,
          row.githubProjectId
        )
      );
      if (!projectId) continue;
      if (!githubTagsByProjectId.has(projectId)) githubTagsByProjectId.set(projectId, []);
      githubTagsByProjectId.get(projectId).push(pick(row.tag, row.name, row.value, ''));
    }

    const githubImagesByProjectId = new Map();
    for (const row of githubImagesRows || []) {
      const projectId = keyOf(
        pick(
          row.github_project_id,
          row.github_projects_id,
          row.id_github_project,
          row.githubProjectId
        )
      );
      if (!projectId) continue;
      if (!githubImagesByProjectId.has(projectId)) githubImagesByProjectId.set(projectId, []);
      githubImagesByProjectId.get(projectId).push({
        image: pick(row.image_url, row.url, ''),
        alt: pick(row.alt_text, row.alt, null),
      });
    }

    const githubProjects = (githubBase || []).map((row) => {
      const rowKey = keyOf(row.id);
      const i18n = githubTextByProjectId.get(rowKey);
      const gallery = (githubImagesByProjectId.get(rowKey) || [])
        .map((item) => item.image)
        .filter(Boolean);

      return {
        id: row.id,
        slug: row.slug || `github-project-${row.id}`,
        title: i18n?.title || '',
        description: i18n?.description || '',
        tags: githubTagsByProjectId.get(rowKey) || [],
        githubUrl: row.github_url || null,
        liveUrl: row.live_url || null,
        image: row.image_url || null,
        images: gallery,
      };
    });

    const payload = { projects, githubProjects };

    if (
      (projects.length > 0 && projects.some((p) => p.title)) ||
      (githubProjects.length > 0 && githubProjects.some((p) => p.title))
    ) {
      cache.set(cacheKey, { at: Date.now(), value: payload });
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
