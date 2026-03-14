import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import type { ApiHandler } from '../lib/types/http.js'

const CACHE_TTL_MS = 60 * 1000
const cache = new Map<string, { at: number; value: ProjectsResponse }>()

type Locale = 'it' | 'en'

interface ProjectRecord {
  id: number | string
  slug?: string | null
  order_index?: number | null
  live_url?: string | null
}

interface ProjectI18nRecord {
  project_id?: number | string | null
  projects_id?: number | string | null
  id_project?: number | string | null
  projectId?: number | string | null
  title?: string | null
  description?: string | null
}

interface ProjectTagRecord {
  project_id?: number | string | null
  projects_id?: number | string | null
  id_project?: number | string | null
  projectId?: number | string | null
  order_index?: number | null
  tag?: string | null
  name?: string | null
  value?: string | null
}

interface GithubProjectRecord {
  id: number | string
  slug?: string | null
  order_index?: number | null
  github_url?: string | null
  live_url?: string | null
  image_url?: string | null
  featured?: boolean | null
}

interface GithubProjectI18nRecord {
  github_project_id?: number | string | null
  github_projects_id?: number | string | null
  id_github_project?: number | string | null
  githubProjectId?: number | string | null
  title?: string | null
  description?: string | null
}

interface GithubProjectTagRecord {
  github_project_id?: number | string | null
  github_projects_id?: number | string | null
  id_github_project?: number | string | null
  githubProjectId?: number | string | null
  order_index?: number | null
  tag?: string | null
  name?: string | null
  value?: string | null
}

interface GithubProjectImageRecord {
  github_project_id?: number | string | null
  github_projects_id?: number | string | null
  id_github_project?: number | string | null
  githubProjectId?: number | string | null
  order_index?: number | null
  image_url?: string | null
  url?: string | null
  alt_text?: string | null
  alt?: string | null
}

interface ProjectSummary {
  id: number | string
  slug: string
  title: string
  description: string
  tags: string[]
  live: string | null
  github: null
}

interface GithubProjectSummary {
  id: number | string
  slug: string
  title: string
  description: string
  tags: string[]
  githubUrl: string | null
  liveUrl: string | null
  image: string | null
  images: string[]
}

interface ProjectsResponse {
  projects: ProjectSummary[]
  githubProjects: GithubProjectSummary[]
}

const keyOf = (value: unknown) =>
  value === undefined || value === null ? null : String(value)

const pick = <T>(...values: Array<T | undefined | null>) =>
  values.find((value) => value !== undefined && value !== null)

const isMissingRelationError = (error: { code?: string; message?: string } | null) =>
  error?.code === 'PGRST205' ||
  error?.code === '42P01' ||
  /could not find the table|relation .* does not exist/i.test(error?.message || '')

const normalizeLocale = (value: string | undefined): Locale =>
  value === 'en' ? 'en' : 'it'

const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const lang = normalizeLocale(req.query?.lang)
  const cacheKey = `projects:${lang}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(cached.value)
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
    ])

    const githubImagesMissing = isMissingRelationError(githubImagesError)

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
      })
      return res.status(500).json({ error: 'Database error' })
    }

    if (githubImagesMissing) {
      console.warn(
        'github_project_images table not found, falling back to image_url previews'
      )
    }

    const textByProjectId = new Map(
      ((i18nRows || []) as ProjectI18nRecord[]).map((row) => [
        keyOf(pick(row.project_id, row.projects_id, row.id_project, row.projectId)),
        row,
      ])
    )

    const tagsByProjectId = new Map<string, string[]>()
    for (const row of (tagsRows || []) as ProjectTagRecord[]) {
      const projectId = keyOf(
        pick(row.project_id, row.projects_id, row.id_project, row.projectId)
      )
      if (!projectId) continue
      if (!tagsByProjectId.has(projectId)) tagsByProjectId.set(projectId, [])
      tagsByProjectId
        .get(projectId)
        ?.push(pick(row.tag, row.name, row.value, '') || '')
    }

    const projects = ((projectsBase || []) as ProjectRecord[]).map((row) => {
      const rowKey = keyOf(row.id)
      const i18n = rowKey ? textByProjectId.get(rowKey) : undefined
      return {
        id: row.id,
        slug: row.slug || `project-${row.id}`,
        title: i18n?.title || '',
        description: i18n?.description || '',
        tags: (rowKey && tagsByProjectId.get(rowKey)) || [],
        live: row.live_url || null,
        github: null,
      }
    })

    const githubTextByProjectId = new Map(
      ((githubI18nRows || []) as GithubProjectI18nRecord[]).map((row) => [
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
    )

    const githubTagsByProjectId = new Map<string, string[]>()
    for (const row of (githubTagsRows || []) as GithubProjectTagRecord[]) {
      const projectId = keyOf(
        pick(
          row.github_project_id,
          row.github_projects_id,
          row.id_github_project,
          row.githubProjectId
        )
      )
      if (!projectId) continue
      if (!githubTagsByProjectId.has(projectId)) {
        githubTagsByProjectId.set(projectId, [])
      }
      githubTagsByProjectId
        .get(projectId)
        ?.push(pick(row.tag, row.name, row.value, '') || '')
    }

    const githubImagesByProjectId = new Map<
      string,
      Array<{ image: string; alt: string | null }>
    >()
    for (const row of (githubImagesRows || []) as GithubProjectImageRecord[]) {
      const projectId = keyOf(
        pick(
          row.github_project_id,
          row.github_projects_id,
          row.id_github_project,
          row.githubProjectId
        )
      )
      if (!projectId) continue
      if (!githubImagesByProjectId.has(projectId)) {
        githubImagesByProjectId.set(projectId, [])
      }
      githubImagesByProjectId.get(projectId)?.push({
        image: pick(row.image_url, row.url, '') || '',
        alt: pick(row.alt_text, row.alt, null) || null,
      })
    }

    const githubProjects = ((githubBase || []) as GithubProjectRecord[]).map((row) => {
      const rowKey = keyOf(row.id)
      const i18n = rowKey ? githubTextByProjectId.get(rowKey) : undefined
      const gallery = ((rowKey && githubImagesByProjectId.get(rowKey)) || [])
        .map((item) => item.image)
        .filter(Boolean)

      return {
        id: row.id,
        slug: row.slug || `github-project-${row.id}`,
        title: i18n?.title || '',
        description: i18n?.description || '',
        tags: (rowKey && githubTagsByProjectId.get(rowKey)) || [],
        githubUrl: row.github_url || null,
        liveUrl: row.live_url || null,
        image: row.image_url || null,
        images: gallery,
      }
    })

    const payload: ProjectsResponse = { projects, githubProjects }

    if (
      (projects.length > 0 && projects.some((project) => project.title)) ||
      (githubProjects.length > 0 &&
        githubProjects.some((project) => project.title))
    ) {
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
