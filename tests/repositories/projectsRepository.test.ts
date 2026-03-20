import { asc, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { db } from '../../lib/db/client.ts'
import {
  fetchProjects,
  normalizeRepositoryLocale,
} from '../../lib/db/repositories/projectsRepository.ts'
import {
  githubProjectImages,
  githubProjectTags,
  githubProjects,
  githubProjectsI18n,
  projectTags,
  projects,
  projectsI18n,
} from '../../lib/db/schema.ts'

const buildExpectedProjects = async (locale: 'it' | 'en') => {
  const projectRows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      liveUrl: projects.liveUrl,
    })
    .from(projects)
    .orderBy(asc(projects.orderIndex))

  const projectI18nRows = await db
    .select({
      projectId: projectsI18n.projectId,
      title: projectsI18n.title,
      description: projectsI18n.description,
    })
    .from(projectsI18n)
    .where(eq(projectsI18n.locale, locale))

  const projectTagRows = await db
    .select({
      projectId: projectTags.projectId,
      tag: projectTags.tag,
    })
    .from(projectTags)
    .orderBy(asc(projectTags.orderIndex))

  const textByProjectId = new Map(
    projectI18nRows.map((row) => [row.projectId, row])
  )

  const tagsByProjectId = new Map<number, string[]>()
  for (const row of projectTagRows) {
    if (!tagsByProjectId.has(row.projectId)) {
      tagsByProjectId.set(row.projectId, [])
    }
    tagsByProjectId.get(row.projectId)?.push(row.tag)
  }

  return projectRows.map((row) => {
    const i18n = textByProjectId.get(row.id)
    return {
      id: row.id,
      slug: row.slug,
      title: i18n?.title || '',
      description: i18n?.description || '',
      tags: tagsByProjectId.get(row.id) || [],
      live: row.liveUrl || null,
      github: null,
    }
  })
}

const buildExpectedGithubProjects = async (locale: 'it' | 'en') => {
  const githubProjectRows = await db
    .select({
      id: githubProjects.id,
      slug: githubProjects.slug,
      githubUrl: githubProjects.githubUrl,
      liveUrl: githubProjects.liveUrl,
    })
    .from(githubProjects)
    .where(eq(githubProjects.featured, true))
    .orderBy(asc(githubProjects.orderIndex))

  const githubProjectI18nRows = await db
    .select({
      githubProjectId: githubProjectsI18n.githubProjectId,
      title: githubProjectsI18n.title,
      description: githubProjectsI18n.description,
    })
    .from(githubProjectsI18n)
    .where(eq(githubProjectsI18n.locale, locale))

  const githubProjectTagRows = await db
    .select({
      githubProjectId: githubProjectTags.githubProjectId,
      tag: githubProjectTags.tag,
    })
    .from(githubProjectTags)
    .orderBy(asc(githubProjectTags.orderIndex))

  const githubProjectImageRows = await db
    .select({
      githubProjectId: githubProjectImages.githubProjectId,
      imageUrl: githubProjectImages.imageUrl,
    })
    .from(githubProjectImages)
    .orderBy(asc(githubProjectImages.orderIndex))

  const textByGithubProjectId = new Map(
    githubProjectI18nRows.map((row) => [row.githubProjectId, row])
  )

  const tagsByGithubProjectId = new Map<number, string[]>()
  for (const row of githubProjectTagRows) {
    if (!tagsByGithubProjectId.has(row.githubProjectId)) {
      tagsByGithubProjectId.set(row.githubProjectId, [])
    }
    tagsByGithubProjectId.get(row.githubProjectId)?.push(row.tag)
  }

  const imagesByGithubProjectId = new Map<number, string[]>()
  for (const row of githubProjectImageRows) {
    if (!imagesByGithubProjectId.has(row.githubProjectId)) {
      imagesByGithubProjectId.set(row.githubProjectId, [])
    }
    if (row.imageUrl) {
      imagesByGithubProjectId.get(row.githubProjectId)?.push(row.imageUrl)
    }
  }

  return githubProjectRows.map((row) => {
    const i18n = textByGithubProjectId.get(row.id)
    return {
      id: row.id,
      slug: row.slug,
      title: i18n?.title || '',
      description: i18n?.description || '',
      tags: tagsByGithubProjectId.get(row.id) || [],
      githubUrl: row.githubUrl || null,
      liveUrl: row.liveUrl || null,
      images: imagesByGithubProjectId.get(row.id) || [],
    }
  })
}

describe('projectsRepository', () => {
  it('normalizes unsupported locales back to italian', () => {
    expect(normalizeRepositoryLocale('it')).toBe('it')
    expect(normalizeRepositoryLocale('en')).toBe('en')
    expect(normalizeRepositoryLocale('fr')).toBe('it')
    expect(normalizeRepositoryLocale(undefined)).toBe('it')
  })

  it('returns a stable italian projects payload', async () => {
    const response = await fetchProjects('it')

    expect(response).toEqual(
      expect.objectContaining({
        projects: expect.any(Array),
        githubProjects: expect.any(Array),
      })
    )
    expect(response.projects[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        tags: expect.any(Array),
        github: null,
      })
    )
    expect(
      response.projects[0]?.live === null ||
        typeof response.projects[0]?.live === 'string'
    ).toBe(true)
    expect(response.githubProjects[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        tags: expect.any(Array),
        images: expect.any(Array),
      })
    )
    expect(typeof response.githubProjects[0]?.githubUrl).toBe('string')
    expect(
      response.githubProjects[0]?.liveUrl === null ||
        typeof response.githubProjects[0]?.liveUrl === 'string'
    ).toBe(true)
  })

  it('returns a stable english projects payload', async () => {
    const response = await fetchProjects('en')

    expect(response).toEqual(
      expect.objectContaining({
        projects: expect.any(Array),
        githubProjects: expect.any(Array),
      })
    )
  })

  it('returns local projects ordered and localized as stored in the database', async () => {
    const response = await fetchProjects('it')
    const expectedProjects = await buildExpectedProjects('it')

    expect(response.projects).toEqual(expectedProjects)
  })

  it('returns english local projects aligned with localized database content', async () => {
    const response = await fetchProjects('en')
    const expectedProjects = await buildExpectedProjects('en')

    expect(response.projects).toEqual(expectedProjects)
  })

  it('returns featured github projects with ordered tags and images', async () => {
    const response = await fetchProjects('it')
    const expectedGithubProjects = await buildExpectedGithubProjects('it')

    expect(response.githubProjects).toEqual(expectedGithubProjects)
  })

  it('returns english featured github projects aligned with localized database content', async () => {
    const response = await fetchProjects('en')
    const expectedGithubProjects = await buildExpectedGithubProjects('en')

    expect(response.githubProjects).toEqual(expectedGithubProjects)
  })
})
