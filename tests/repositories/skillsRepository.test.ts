import { asc, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { db } from '../../lib/db/client.ts'
import { fetchSkills } from '../../lib/db/repositories/skillsRepository.ts'
import {
  skillCategories,
  skillCategoriesI18n,
  skillItems,
  skillItemsI18n,
  techCategories,
  techCategoriesI18n,
  techItems,
} from '../../lib/db/schema.ts'

const buildExpectedTechStack = async (locale: 'it' | 'en') => {
  const techCategoryRows = await db
    .select({
      id: techCategories.id,
      slug: techCategories.slug,
    })
    .from(techCategories)
    .orderBy(asc(techCategories.orderIndex))

  const techCategoryI18nRows = await db
    .select({
      techCategoryId: techCategoriesI18n.techCategoryId,
      name: techCategoriesI18n.name,
    })
    .from(techCategoriesI18n)
    .where(eq(techCategoriesI18n.locale, locale))

  const techItemRows = await db
    .select({
      techCategoryId: techItems.techCategoryId,
      name: techItems.name,
      devicon: techItems.devicon,
      color: techItems.color,
    })
    .from(techItems)
    .orderBy(asc(techItems.orderIndex))

  const categoryNameById = new Map(
    techCategoryI18nRows.map((row) => [row.techCategoryId, row.name || ''])
  )

  const itemsByCategoryId = new Map<
    number,
    Array<{ name: string; devicon: string; color: string }>
  >()
  for (const row of techItemRows) {
    if (!itemsByCategoryId.has(row.techCategoryId)) {
      itemsByCategoryId.set(row.techCategoryId, [])
    }

    itemsByCategoryId.get(row.techCategoryId)?.push({
      name: row.name || '',
      devicon: row.devicon || '',
      color: row.color || '#999999',
    })
  }

  return techCategoryRows.map((row) => ({
    category: categoryNameById.get(row.id) || row.slug || '',
    items: itemsByCategoryId.get(row.id) || [],
  }))
}

const buildExpectedCategories = async (locale: 'it' | 'en') => {
  const skillCategoryRows = await db
    .select({
      id: skillCategories.id,
    })
    .from(skillCategories)
    .orderBy(asc(skillCategories.orderIndex))

  const skillCategoryI18nRows = await db
    .select({
      skillCategoryId: skillCategoriesI18n.skillCategoryId,
      categoryName: skillCategoriesI18n.categoryName,
    })
    .from(skillCategoriesI18n)
    .where(eq(skillCategoriesI18n.locale, locale))

  const skillItemRows = await db
    .select({
      id: skillItems.id,
      skillCategoryId: skillItems.skillCategoryId,
    })
    .from(skillItems)
    .orderBy(asc(skillItems.orderIndex))

  const skillItemI18nRows = await db
    .select({
      skillItemId: skillItemsI18n.skillItemId,
      label: skillItemsI18n.label,
    })
    .from(skillItemsI18n)
    .where(eq(skillItemsI18n.locale, locale))

  const categoryNameById = new Map(
    skillCategoryI18nRows.map((row) => [row.skillCategoryId, row.categoryName || ''])
  )
  const labelByItemId = new Map(
    skillItemI18nRows.map((row) => [row.skillItemId, row.label || ''])
  )

  const labelsByCategoryId = new Map<number, string[]>()
  for (const row of skillItemRows) {
    const label = labelByItemId.get(row.id)
    if (!label) continue
    if (!labelsByCategoryId.has(row.skillCategoryId)) {
      labelsByCategoryId.set(row.skillCategoryId, [])
    }
    labelsByCategoryId.get(row.skillCategoryId)?.push(label)
  }

  return skillCategoryRows.map((row) => ({
    category: categoryNameById.get(row.id) || `Category ${row.id}`,
    skills: labelsByCategoryId.get(row.id) || [],
  }))
}

describe('skillsRepository', () => {
  it('returns a stable italian skills payload', async () => {
    const response = await fetchSkills('it')

    expect(response).toEqual(
      expect.objectContaining({
        techStack: expect.any(Array),
        categories: expect.any(Array),
      })
    )
    expect(response.techStack[0]).toEqual(
      expect.objectContaining({
        category: expect.any(String),
        items: expect.any(Array),
      })
    )
    expect(response.categories[0]).toEqual(
      expect.objectContaining({
        category: expect.any(String),
        skills: expect.any(Array),
      })
    )
  })

  it('returns a stable english skills payload', async () => {
    const response = await fetchSkills('en')

    expect(response).toEqual(
      expect.objectContaining({
        techStack: expect.any(Array),
        categories: expect.any(Array),
      })
    )
  })

  it('returns tech stack categories and items aligned with the italian database content', async () => {
    const response = await fetchSkills('it')
    const expectedTechStack = await buildExpectedTechStack('it')

    expect(response.techStack).toEqual(expectedTechStack)
  })

  it('returns english tech stack categories and items aligned with localized database content', async () => {
    const response = await fetchSkills('en')
    const expectedTechStack = await buildExpectedTechStack('en')

    expect(response.techStack).toEqual(expectedTechStack)
  })

  it('returns skill categories and labels aligned with the italian database content', async () => {
    const response = await fetchSkills('it')
    const expectedCategories = await buildExpectedCategories('it')

    expect(response.categories).toEqual(expectedCategories)
  })

  it('returns english skill categories and labels aligned with localized database content', async () => {
    const response = await fetchSkills('en')
    const expectedCategories = await buildExpectedCategories('en')

    expect(response.categories).toEqual(expectedCategories)
  })
})
