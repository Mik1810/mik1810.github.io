import { asc, eq } from 'drizzle-orm'

import { db } from '../client.js'
import { runDbRead } from '../runDbRead.js'
import {
  githubProjectImages,
  githubProjectTags,
  githubProjects,
  githubProjectsI18n,
  projectTags,
  projects,
  projectsI18n,
} from '../schema.js'

export type RepositoryLocale = 'it' | 'en'

export interface ProjectSummary {
  id: number | string
  slug: string
  title: string
  description: string
  tags: string[]
  live: string | null
  github: null
}

export interface GithubProjectSummary {
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

export interface ProjectsResponse {
  projects: ProjectSummary[]
  githubProjects: GithubProjectSummary[]
}

export const normalizeRepositoryLocale = (value: string | undefined): RepositoryLocale =>
  value === 'en' ? 'en' : 'it'

export const fetchProjects = async (
  locale: RepositoryLocale
): Promise<ProjectsResponse> => {
  const projectRows = await runDbRead(() =>
    db
      .select({
        id: projects.id,
        slug: projects.slug,
        orderIndex: projects.orderIndex,
        liveUrl: projects.liveUrl,
      })
      .from(projects)
      .orderBy(asc(projects.orderIndex))
  )

  const projectI18nRows = await runDbRead(() =>
    db
      .select({
        projectId: projectsI18n.projectId,
        title: projectsI18n.title,
        description: projectsI18n.description,
      })
      .from(projectsI18n)
      .where(eq(projectsI18n.locale, locale))
  )

  const projectTagRows = await runDbRead(() =>
    db
      .select({
        projectId: projectTags.projectId,
        orderIndex: projectTags.orderIndex,
        tag: projectTags.tag,
      })
      .from(projectTags)
      .orderBy(asc(projectTags.orderIndex))
  )

  const githubProjectRows = await runDbRead(() =>
    db
      .select({
        id: githubProjects.id,
        slug: githubProjects.slug,
        orderIndex: githubProjects.orderIndex,
        githubUrl: githubProjects.githubUrl,
        liveUrl: githubProjects.liveUrl,
        imageUrl: githubProjects.imageUrl,
      })
      .from(githubProjects)
      .where(eq(githubProjects.featured, true))
      .orderBy(asc(githubProjects.orderIndex))
  )

  const githubProjectI18nRows = await runDbRead(() =>
    db
      .select({
        githubProjectId: githubProjectsI18n.githubProjectId,
        title: githubProjectsI18n.title,
        description: githubProjectsI18n.description,
      })
      .from(githubProjectsI18n)
      .where(eq(githubProjectsI18n.locale, locale))
  )

  const githubProjectTagRows = await runDbRead(() =>
    db
      .select({
        githubProjectId: githubProjectTags.githubProjectId,
        orderIndex: githubProjectTags.orderIndex,
        tag: githubProjectTags.tag,
      })
      .from(githubProjectTags)
      .orderBy(asc(githubProjectTags.orderIndex))
  )

  const githubProjectImageRows = await runDbRead(() =>
    db
      .select({
        githubProjectId: githubProjectImages.githubProjectId,
        orderIndex: githubProjectImages.orderIndex,
        imageUrl: githubProjectImages.imageUrl,
      })
      .from(githubProjectImages)
      .orderBy(asc(githubProjectImages.orderIndex))
  )

  const textByProjectId = new Map(
    projectI18nRows.map((row) => [row.projectId, row])
  )

  const tagsByProjectId = new Map<number, string[]>()
  for (const row of projectTagRows) {
    const projectId = row.projectId
    if (!tagsByProjectId.has(projectId)) tagsByProjectId.set(projectId, [])
    tagsByProjectId.get(projectId)?.push(row.tag || '')
  }

  const projectList = projectRows.map((row) => {
    const i18n = textByProjectId.get(row.id)
    return {
      id: row.id,
      slug: row.slug || `project-${row.id}`,
      title: i18n?.title || '',
      description: i18n?.description || '',
      tags: tagsByProjectId.get(row.id) || [],
      live: row.liveUrl || null,
      github: null,
    }
  })

  const githubTextByProjectId = new Map(
    githubProjectI18nRows.map((row) => [row.githubProjectId, row])
  )

  const githubTagsByProjectId = new Map<number, string[]>()
  for (const row of githubProjectTagRows) {
    const projectId = row.githubProjectId
    if (!githubTagsByProjectId.has(projectId)) githubTagsByProjectId.set(projectId, [])
    githubTagsByProjectId.get(projectId)?.push(row.tag || '')
  }

  const githubImagesByProjectId = new Map<number, string[]>()
  for (const row of githubProjectImageRows) {
    const projectId = row.githubProjectId
    if (!githubImagesByProjectId.has(projectId)) {
      githubImagesByProjectId.set(projectId, [])
    }
    const image = row.imageUrl || ''
    if (image) githubImagesByProjectId.get(projectId)?.push(image)
  }

  const githubProjectList = githubProjectRows.map((row) => {
    const i18n = githubTextByProjectId.get(row.id)
    return {
      id: row.id,
      slug: row.slug || `github-project-${row.id}`,
      title: i18n?.title || '',
      description: i18n?.description || '',
      tags: githubTagsByProjectId.get(row.id) || [],
      githubUrl: row.githubUrl || null,
      liveUrl: row.liveUrl || null,
      image: row.imageUrl || null,
      images: githubImagesByProjectId.get(row.id) || [],
    }
  })

  return { projects: projectList, githubProjects: githubProjectList }
}
