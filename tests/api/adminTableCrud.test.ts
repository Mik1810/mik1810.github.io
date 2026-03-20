import { randomUUID } from 'node:crypto'

import { and, eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'

import adminHandler from '../../api/admin.ts'
import { getAdminTableConfig } from '../../lib/adminTables.ts'
import {
  createSessionCookie,
  createSessionToken,
} from '../../lib/authSession.ts'
import { db } from '../../lib/db/client.ts'
import { invokeApiHandler } from './testUtils.ts'

type AdminRow = Record<string, unknown>
type ScenarioSetup = Record<string, AdminRow>

interface ScenarioContext {
  token: string
  createUniqueSlug: (label: string) => string
  createUniqueUrl: (label: string) => string
  createUniqueText: (label: string) => string
  nextOrderIndex: () => number
  createFixture: (table: string, row: AdminRow) => Promise<AdminRow>
}

interface CrudScenario<TSetup extends ScenarioSetup | undefined = undefined> {
  table: string
  setup?: (ctx: ScenarioContext) => Promise<TSetup>
  createRow: (ctx: ScenarioContext, setup: TSetup) => AdminRow
  updateRow: (
    ctx: ScenarioContext,
    setup: TSetup,
    createdRow: AdminRow
  ) => AdminRow
}

const adminCookie = createSessionCookie(
  createSessionToken({
    id: 'admin_crud_test',
    email: 'admin@example.com',
  })
)

const adminHeaders = {
  host: 'localhost',
  cookie: adminCookie,
}

const cleanupStack: Array<{ table: string; keys: AdminRow }> = []

const createTestContext = (): ScenarioContext => {
  const token = randomUUID().slice(0, 8)
  const baseOrderIndex = 700_000_000 + Math.floor(Math.random() * 1_000_000)
  let orderIndexOffset = 0

  const nextOrderIndex = () => baseOrderIndex + orderIndexOffset++
  const createUniqueSlug = (label: string) => `crud-${label}-${token}-${nextOrderIndex()}`
  const createUniqueUrl = (label: string) =>
    `https://example.com/${label}/${token}/${nextOrderIndex()}`
  const createUniqueText = (label: string) =>
    `${label.replaceAll('-', ' ')} ${token} ${nextOrderIndex()}`

  return {
    token,
    createUniqueSlug,
    createUniqueUrl,
    createUniqueText,
    nextOrderIndex,
    createFixture: async (table, row) => {
      const createdRow = await createAdminRow(table, row)
      registerCleanup(table, createdRow)
      return createdRow
    },
  }
}

const getPrimaryKeys = (table: string, row: AdminRow) => {
  const config = getAdminTableConfig(table)
  if (!config) {
    throw new Error(`Unknown admin table: ${table}`)
  }

  return Object.fromEntries(
    config.primaryKeys.map((key) => {
      if (row[key] === undefined) {
        throw new Error(`Missing primary key ${key} for table ${table}`)
      }
      return [key, row[key]]
    })
  )
}

const registerCleanup = (table: string, row: AdminRow) => {
  cleanupStack.push({
    table,
    keys: getPrimaryKeys(table, row),
  })
}

const unregisterCleanup = (table: string, row: AdminRow) => {
  const keys = getPrimaryKeys(table, row)
  const serialized = JSON.stringify(keys)
  const index = cleanupStack.findIndex(
    (entry) => entry.table === table && JSON.stringify(entry.keys) === serialized
  )

  if (index >= 0) {
    cleanupStack.splice(index, 1)
  }
}

const directDeleteByKeys = async (table: string, keys: AdminRow) => {
  const config = getAdminTableConfig(table)
  if (!config) return

  const conditions = Object.entries(keys).map(([dbName, value]) =>
    eq(config.columnsByDbName[dbName]?.column as never, value as never)
  )

  if (conditions.length === 0) return

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)

  await db.delete(config.table).where(whereClause as never)
}

const listAdminRows = async (table: string, limit = 1000, ip = '127.0.4.1') => {
  const response = await invokeApiHandler(adminHandler, {
    method: 'GET',
    url: `/api/admin/table?table=${table}&limit=${limit}`,
    ip,
    headers: adminHeaders,
  })

  expect(response.statusCode).toBe(200)
  expect(response.body).toEqual(
    expect.objectContaining({
      rows: expect.any(Array),
    })
  )

  return (response.body as { rows: AdminRow[] }).rows
}

const findRowByKeys = (table: string, rows: AdminRow[], row: AdminRow) => {
  const keys = getPrimaryKeys(table, row)

  return rows.find((candidate) =>
    Object.entries(keys).every(([key, value]) => candidate[key] === value)
  )
}

const createAdminRow = async (table: string, row: AdminRow, ip = '127.0.4.2') => {
  const response = await invokeApiHandler(adminHandler, {
    method: 'POST',
    url: `/api/admin/table?table=${table}`,
    ip,
    headers: adminHeaders,
    body: { row },
  })

  expect(response.statusCode).toBe(201)
  expect(response.body).toEqual(
    expect.objectContaining({
      row: expect.any(Object),
    })
  )

  return (response.body as { row: AdminRow }).row
}

const updateAdminRow = async (
  table: string,
  keys: AdminRow,
  row: AdminRow,
  ip = '127.0.4.3'
) => {
  const response = await invokeApiHandler(adminHandler, {
    method: 'PATCH',
    url: `/api/admin/table?table=${table}`,
    ip,
    headers: adminHeaders,
    body: { keys, row },
  })

  expect(response.statusCode).toBe(200)
  expect(response.body).toEqual(
    expect.objectContaining({
      row: expect.any(Object),
    })
  )

  return (response.body as { row: AdminRow }).row
}

const deleteAdminRow = async (table: string, keys: AdminRow, ip = '127.0.4.4') => {
  const response = await invokeApiHandler(adminHandler, {
    method: 'DELETE',
    url: `/api/admin/table?table=${table}`,
    ip,
    headers: adminHeaders,
    body: { keys },
  })

  expect(response.statusCode).toBe(200)
  expect(response.body).toEqual({ ok: true })
}

const runCrudScenario = async <TSetup extends ScenarioSetup | undefined>(
  scenario: CrudScenario<TSetup>
) => {
  const ctx = createTestContext()
  const setup = scenario.setup ? await scenario.setup(ctx) : undefined

  const createPayload = scenario.createRow(ctx, setup as TSetup)
  const createdRow = await createAdminRow(scenario.table, createPayload)
  registerCleanup(scenario.table, createdRow)

  expect(createdRow).toEqual(expect.objectContaining(createPayload))

  const rowsAfterCreate = await listAdminRows(scenario.table, 1000, '127.0.4.10')
  expect(findRowByKeys(scenario.table, rowsAfterCreate, createdRow)).toEqual(
    expect.objectContaining(createPayload)
  )

  const keys = getPrimaryKeys(scenario.table, createdRow)
  const updatePayload = scenario.updateRow(ctx, setup as TSetup, createdRow)
  const updatedRow = await updateAdminRow(scenario.table, keys, updatePayload)

  expect(updatedRow).toEqual(
    expect.objectContaining({
      ...keys,
      ...updatePayload,
    })
  )

  const rowsAfterUpdate = await listAdminRows(scenario.table, 1000, '127.0.4.11')
  expect(findRowByKeys(scenario.table, rowsAfterUpdate, createdRow)).toEqual(
    expect.objectContaining({
      ...keys,
      ...updatePayload,
    })
  )

  await deleteAdminRow(scenario.table, keys, '127.0.4.12')
  unregisterCleanup(scenario.table, createdRow)

  const rowsAfterDelete = await listAdminRows(scenario.table, 1000, '127.0.4.13')
  expect(findRowByKeys(scenario.table, rowsAfterDelete, createdRow)).toBeUndefined()
}

const crudScenarios: CrudScenario<ScenarioSetup | undefined>[] = [
  {
    table: 'social_links',
    createRow: (ctx) => ({
      profile_id: 1,
      order_index: ctx.nextOrderIndex(),
      name: ctx.createUniqueText('social link'),
      url: ctx.createUniqueUrl('social-link'),
      icon_key: 'github',
    }),
    updateRow: (ctx) => ({
      name: ctx.createUniqueText('social link updated'),
      url: ctx.createUniqueUrl('social-link-updated'),
      icon_key: 'linkedin',
    }),
  },
  {
    table: 'hero_roles',
    createRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
    updateRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
  },
  {
    table: 'hero_roles_i18n',
    setup: async (ctx) => ({
      heroRole: await ctx.createFixture('hero_roles', {
        order_index: ctx.nextOrderIndex(),
      }),
    }),
    createRow: (ctx, setup) => ({
      hero_role_id: setup.heroRole.id,
      locale: 'it',
      role: ctx.createUniqueText('hero role'),
    }),
    updateRow: (ctx) => ({
      role: ctx.createUniqueText('hero role updated'),
    }),
  },
  {
    table: 'about_interests',
    createRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
    updateRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
  },
  {
    table: 'about_interests_i18n',
    setup: async (ctx) => ({
      aboutInterest: await ctx.createFixture('about_interests', {
        order_index: ctx.nextOrderIndex(),
      }),
    }),
    createRow: (ctx, setup) => ({
      about_interest_id: setup.aboutInterest.id,
      locale: 'it',
      interest: ctx.createUniqueText('about interest'),
    }),
    updateRow: (ctx) => ({
      interest: ctx.createUniqueText('about interest updated'),
    }),
  },
  {
    table: 'projects',
    createRow: (ctx) => ({
      slug: ctx.createUniqueSlug('project'),
      order_index: ctx.nextOrderIndex(),
      live_url: ctx.createUniqueUrl('project'),
    }),
    updateRow: (ctx) => ({
      slug: ctx.createUniqueSlug('project-updated'),
      order_index: ctx.nextOrderIndex(),
      live_url: ctx.createUniqueUrl('project-updated'),
    }),
  },
  {
    table: 'projects_i18n',
    setup: async (ctx) => ({
      project: await ctx.createFixture('projects', {
        slug: ctx.createUniqueSlug('project-parent'),
        order_index: ctx.nextOrderIndex(),
        live_url: ctx.createUniqueUrl('project-parent'),
      }),
    }),
    createRow: (ctx, setup) => ({
      project_id: setup.project.id,
      locale: 'it',
      title: ctx.createUniqueText('project title'),
      description: ctx.createUniqueText('project description'),
    }),
    updateRow: (ctx) => ({
      title: ctx.createUniqueText('project title updated'),
      description: ctx.createUniqueText('project description updated'),
    }),
  },
  {
    table: 'project_tags',
    setup: async (ctx) => ({
      project: await ctx.createFixture('projects', {
        slug: ctx.createUniqueSlug('project-tag-parent'),
        order_index: ctx.nextOrderIndex(),
        live_url: ctx.createUniqueUrl('project-tag-parent'),
      }),
    }),
    createRow: (ctx, setup) => ({
      project_id: setup.project.id,
      order_index: ctx.nextOrderIndex(),
      tag: ctx.createUniqueText('project tag'),
    }),
    updateRow: (ctx) => ({
      tag: ctx.createUniqueText('project tag updated'),
    }),
  },
  {
    table: 'github_projects',
    createRow: (ctx) => ({
      slug: ctx.createUniqueSlug('github-project'),
      order_index: ctx.nextOrderIndex(),
      github_url: ctx.createUniqueUrl('github-project-repo'),
      live_url: ctx.createUniqueUrl('github-project-live'),
      featured: true,
    }),
    updateRow: (ctx) => ({
      slug: ctx.createUniqueSlug('github-project-updated'),
      order_index: ctx.nextOrderIndex(),
      github_url: ctx.createUniqueUrl('github-project-repo-updated'),
      live_url: ctx.createUniqueUrl('github-project-live-updated'),
      featured: false,
    }),
  },
  {
    table: 'github_projects_i18n',
    setup: async (ctx) => ({
      githubProject: await ctx.createFixture('github_projects', {
        slug: ctx.createUniqueSlug('github-project-parent'),
        order_index: ctx.nextOrderIndex(),
        github_url: ctx.createUniqueUrl('github-project-parent-repo'),
        live_url: ctx.createUniqueUrl('github-project-parent-live'),
        featured: true,
      }),
    }),
    createRow: (ctx, setup) => ({
      github_project_id: setup.githubProject.id,
      locale: 'it',
      title: ctx.createUniqueText('github project title'),
      description: ctx.createUniqueText('github project description'),
    }),
    updateRow: (ctx) => ({
      title: ctx.createUniqueText('github project title updated'),
      description: ctx.createUniqueText('github project description updated'),
    }),
  },
  {
    table: 'github_project_tags',
    setup: async (ctx) => ({
      githubProject: await ctx.createFixture('github_projects', {
        slug: ctx.createUniqueSlug('github-project-tag-parent'),
        order_index: ctx.nextOrderIndex(),
        github_url: ctx.createUniqueUrl('github-project-tag-parent-repo'),
        live_url: ctx.createUniqueUrl('github-project-tag-parent-live'),
        featured: true,
      }),
    }),
    createRow: (ctx, setup) => ({
      github_project_id: setup.githubProject.id,
      order_index: ctx.nextOrderIndex(),
      tag: ctx.createUniqueText('github project tag'),
    }),
    updateRow: (ctx) => ({
      tag: ctx.createUniqueText('github project tag updated'),
    }),
  },
  {
    table: 'github_project_images',
    setup: async (ctx) => ({
      githubProject: await ctx.createFixture('github_projects', {
        slug: ctx.createUniqueSlug('github-project-image-parent'),
        order_index: ctx.nextOrderIndex(),
        github_url: ctx.createUniqueUrl('github-project-image-parent-repo'),
        live_url: ctx.createUniqueUrl('github-project-image-parent-live'),
        featured: true,
      }),
    }),
    createRow: (ctx, setup) => ({
      github_project_id: setup.githubProject.id,
      order_index: ctx.nextOrderIndex(),
      image_url: ctx.createUniqueUrl('github-project-image'),
      alt_text: ctx.createUniqueText('github project image'),
    }),
    updateRow: (ctx) => ({
      image_url: ctx.createUniqueUrl('github-project-image-updated'),
      alt_text: ctx.createUniqueText('github project image updated'),
    }),
  },
  {
    table: 'experiences',
    createRow: (ctx) => ({
      slug: ctx.createUniqueSlug('experience'),
      order_index: ctx.nextOrderIndex(),
      logo: ctx.createUniqueUrl('experience-logo'),
      logo_bg: '#123456',
    }),
    updateRow: (ctx) => ({
      slug: ctx.createUniqueSlug('experience-updated'),
      order_index: ctx.nextOrderIndex(),
      logo: ctx.createUniqueUrl('experience-logo-updated'),
      logo_bg: '#654321',
    }),
  },
  {
    table: 'experiences_i18n',
    setup: async (ctx) => ({
      experience: await ctx.createFixture('experiences', {
        slug: ctx.createUniqueSlug('experience-parent'),
        order_index: ctx.nextOrderIndex(),
        logo: ctx.createUniqueUrl('experience-parent-logo'),
        logo_bg: '#abcdef',
      }),
    }),
    createRow: (ctx, setup) => ({
      experience_id: setup.experience.id,
      locale: 'it',
      role: ctx.createUniqueText('experience role'),
      company: ctx.createUniqueText('experience company'),
      period: ctx.createUniqueText('experience period'),
      description: ctx.createUniqueText('experience description'),
    }),
    updateRow: (ctx) => ({
      role: ctx.createUniqueText('experience role updated'),
      company: ctx.createUniqueText('experience company updated'),
      period: ctx.createUniqueText('experience period updated'),
      description: ctx.createUniqueText('experience description updated'),
    }),
  },
  {
    table: 'education',
    createRow: (ctx) => ({
      slug: ctx.createUniqueSlug('education'),
      order_index: ctx.nextOrderIndex(),
      logo: ctx.createUniqueUrl('education-logo'),
    }),
    updateRow: (ctx) => ({
      slug: ctx.createUniqueSlug('education-updated'),
      order_index: ctx.nextOrderIndex(),
      logo: ctx.createUniqueUrl('education-logo-updated'),
    }),
  },
  {
    table: 'education_i18n',
    setup: async (ctx) => ({
      education: await ctx.createFixture('education', {
        slug: ctx.createUniqueSlug('education-parent'),
        order_index: ctx.nextOrderIndex(),
        logo: ctx.createUniqueUrl('education-parent-logo'),
      }),
    }),
    createRow: (ctx, setup) => ({
      education_id: setup.education.id,
      locale: 'it',
      degree: ctx.createUniqueText('education degree'),
      institution: ctx.createUniqueText('education institution'),
      period: ctx.createUniqueText('education period'),
      description: ctx.createUniqueText('education description'),
    }),
    updateRow: (ctx) => ({
      degree: ctx.createUniqueText('education degree updated'),
      institution: ctx.createUniqueText('education institution updated'),
      period: ctx.createUniqueText('education period updated'),
      description: ctx.createUniqueText('education description updated'),
    }),
  },
  {
    table: 'tech_categories',
    createRow: (ctx) => ({
      slug: ctx.createUniqueSlug('tech-category'),
      order_index: ctx.nextOrderIndex(),
    }),
    updateRow: (ctx) => ({
      slug: ctx.createUniqueSlug('tech-category-updated'),
      order_index: ctx.nextOrderIndex(),
    }),
  },
  {
    table: 'tech_categories_i18n',
    setup: async (ctx) => ({
      techCategory: await ctx.createFixture('tech_categories', {
        slug: ctx.createUniqueSlug('tech-category-parent'),
        order_index: ctx.nextOrderIndex(),
      }),
    }),
    createRow: (ctx, setup) => ({
      tech_category_id: setup.techCategory.id,
      locale: 'it',
      name: ctx.createUniqueText('tech category name'),
    }),
    updateRow: (ctx) => ({
      name: ctx.createUniqueText('tech category name updated'),
    }),
  },
  {
    table: 'tech_items',
    setup: async (ctx) => ({
      techCategory: await ctx.createFixture('tech_categories', {
        slug: ctx.createUniqueSlug('tech-item-parent'),
        order_index: ctx.nextOrderIndex(),
      }),
    }),
    createRow: (ctx, setup) => ({
      tech_category_id: setup.techCategory.id,
      order_index: ctx.nextOrderIndex(),
      name: ctx.createUniqueText('tech item'),
      devicon: 'typescript',
      color: '#999999',
    }),
    updateRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
      name: ctx.createUniqueText('tech item updated'),
      devicon: 'react',
      color: '#112233',
    }),
  },
  {
    table: 'skill_categories',
    createRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
    updateRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
  },
  {
    table: 'skill_categories_i18n',
    setup: async (ctx) => ({
      skillCategory: await ctx.createFixture('skill_categories', {
        order_index: ctx.nextOrderIndex(),
      }),
    }),
    createRow: (ctx, setup) => ({
      skill_category_id: setup.skillCategory.id,
      locale: 'it',
      category_name: ctx.createUniqueText('skill category'),
    }),
    updateRow: (ctx) => ({
      category_name: ctx.createUniqueText('skill category updated'),
    }),
  },
  {
    table: 'skill_items',
    setup: async (ctx) => ({
      skillCategory: await ctx.createFixture('skill_categories', {
        order_index: ctx.nextOrderIndex(),
      }),
    }),
    createRow: (ctx, setup) => ({
      skill_category_id: setup.skillCategory.id,
      order_index: ctx.nextOrderIndex(),
    }),
    updateRow: (ctx) => ({
      order_index: ctx.nextOrderIndex(),
    }),
  },
  {
    table: 'skill_items_i18n',
    setup: async (ctx) => {
      const skillCategory = await ctx.createFixture('skill_categories', {
        order_index: ctx.nextOrderIndex(),
      })
      const skillItem = await ctx.createFixture('skill_items', {
        skill_category_id: skillCategory.id,
        order_index: ctx.nextOrderIndex(),
      })

      return { skillItem }
    },
    createRow: (ctx, setup) => ({
      skill_item_id: setup.skillItem.id,
      locale: 'it',
      label: ctx.createUniqueText('skill item label'),
    }),
    updateRow: (ctx) => ({
      label: ctx.createUniqueText('skill item label updated'),
    }),
  },
]

afterEach(async () => {
  while (cleanupStack.length > 0) {
    const item = cleanupStack.pop()
    if (!item) continue
    await directDeleteByKeys(item.table, item.keys)
  }
})

describe('Admin table CRUD integration', () => {
  for (const scenario of crudScenarios) {
    it(`performs create, read, update, and delete for ${scenario.table}`, async () => {
      await runCrudScenario(scenario)
    })
  }

  it('updates and restores the singleton profile row safely', async () => {
    const rows = await listAdminRows('profile', 10, '127.0.4.40')
    const originalRow = rows.find((row) => row.id === 1)

    expect(originalRow).toBeDefined()
    if (!originalRow) return

    const token = randomUUID().slice(0, 8)
    const updatedFullName = `${String(originalRow.full_name)} [crud-${token}]`

    try {
      const updatedRow = await updateAdminRow(
        'profile',
        { id: 1 },
        { full_name: updatedFullName },
        '127.0.4.41'
      )

      expect(updatedRow).toEqual(
        expect.objectContaining({
          id: 1,
          full_name: updatedFullName,
        })
      )

      const rowsAfterUpdate = await listAdminRows('profile', 10, '127.0.4.42')
      expect(rowsAfterUpdate.find((row) => row.id === 1)).toEqual(
        expect.objectContaining({
          full_name: updatedFullName,
        })
      )
    } finally {
      await updateAdminRow(
        'profile',
        { id: 1 },
        { full_name: originalRow.full_name as string },
        '127.0.4.43'
      )
    }
  })

  it('updates and restores the singleton profile_i18n rows safely', async () => {
    const rows = await listAdminRows('profile_i18n', 10, '127.0.4.50')
    const originalRow =
      rows.find((row) => row.profile_id === 1 && row.locale === 'en') ||
      rows.find((row) => row.profile_id === 1 && row.locale === 'it')

    expect(originalRow).toBeDefined()
    if (!originalRow) return

    const token = randomUUID().slice(0, 8)
    const updatedGreeting = `${String(originalRow.greeting)} [crud-${token}]`

    try {
      const updatedRow = await updateAdminRow(
        'profile_i18n',
        {
          profile_id: originalRow.profile_id,
          locale: originalRow.locale,
        },
        { greeting: updatedGreeting },
        '127.0.4.51'
      )

      expect(updatedRow).toEqual(
        expect.objectContaining({
          profile_id: originalRow.profile_id,
          locale: originalRow.locale,
          greeting: updatedGreeting,
        })
      )

      const rowsAfterUpdate = await listAdminRows('profile_i18n', 10, '127.0.4.52')
      expect(
        rowsAfterUpdate.find(
          (row) =>
            row.profile_id === originalRow.profile_id &&
            row.locale === originalRow.locale
        )
      ).toEqual(
        expect.objectContaining({
          greeting: updatedGreeting,
        })
      )
    } finally {
      await updateAdminRow(
        'profile_i18n',
        {
          profile_id: originalRow.profile_id as number,
          locale: originalRow.locale as string,
        },
        { greeting: originalRow.greeting as string },
        '127.0.4.53'
      )
    }
  })
})
