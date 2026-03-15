import { getTableColumns } from 'drizzle-orm'
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

import * as schema from './db/schema.js'
import type {
  AdminFieldRule,
  AdminTableColumnConfig,
  AdminTableConfig,
  AdminTablesMap,
} from './types/admin.js'

interface AdminTableDefinitionInput {
  label: string
  table: AnyPgTable
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
  fieldRules?: Record<string, AdminFieldRule>
}

const SUPPORTED_LOCALES = new Set(['it', 'en'])

const trimString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value

const isUrlLike = (value: string) => {
  if (value.startsWith('/')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const isEmailLike = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const integerRule = ({
  min,
}: {
  min?: number
} = {}): AdminFieldRule => ({
  normalize: (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^-?\d+$/.test(trimmed)) {
        return Number.parseInt(trimmed, 10)
      }
    }
    return value
  },
  validate: (value, context) => {
    if (!Number.isInteger(value)) {
      throw new Error(`${context.column.dbName} must be an integer`)
    }
    if (min !== undefined && (value as number) < min) {
      throw new Error(`${context.column.dbName} must be >= ${min}`)
    }
  },
})

const requiredTextRule = (): AdminFieldRule => ({
  normalize: (value) => trimString(value),
  validate: (value, context) => {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`${context.column.dbName} cannot be empty`)
    }
  },
})

const optionalTextRule = (): AdminFieldRule => ({
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value !== null && typeof value !== 'string') {
      throw new Error(`${context.column.dbName} must be a string or null`)
    }
  },
})

const localeRule = (): AdminFieldRule => ({
  normalize: (value) => trimString(value),
  validate: (value, context) => {
    if (typeof value !== 'string' || !SUPPORTED_LOCALES.has(value)) {
      throw new Error(
        `${context.column.dbName} must be one of: ${Array.from(
          SUPPORTED_LOCALES
        ).join(', ')}`
      )
    }
  },
})

const booleanRule = (): AdminFieldRule => ({
  normalize: (value) => {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
    return value
  },
  validate: (value, context) => {
    if (typeof value !== 'boolean') {
      throw new Error(`${context.column.dbName} must be a boolean`)
    }
  },
})

const optionalUrlRule = (): AdminFieldRule => ({
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value === null) return
    if (typeof value !== 'string' || !isUrlLike(value)) {
      throw new Error(`${context.column.dbName} must be a valid URL or path`)
    }
  },
})

const requiredUrlRule = (): AdminFieldRule => ({
  normalize: (value) => trimString(value),
  validate: (value, context) => {
    if (typeof value !== 'string' || value.length === 0 || !isUrlLike(value)) {
      throw new Error(`${context.column.dbName} must be a valid URL or path`)
    }
  },
})

const optionalEmailRule = (): AdminFieldRule => ({
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value === null) return
    if (typeof value !== 'string' || !isEmailLike(value)) {
      throw new Error(`${context.column.dbName} must be a valid email`)
    }
  },
})

const optionalHexColorRule = (): AdminFieldRule => ({
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value === null) return
    if (
      typeof value !== 'string' ||
      !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
    ) {
      throw new Error(`${context.column.dbName} must be a valid hex color`)
    }
  },
})

const buildColumns = (table: AnyPgTable) =>
  Object.entries(getTableColumns(table)).map(([propertyKey, column]) => ({
    propertyKey,
    dbName: column.name,
    column: column as AnyPgColumn,
  }))

const toColumnsByDbName = (columns: AdminTableColumnConfig[]) =>
  Object.fromEntries(columns.map((column) => [column.dbName, column])) as Record<
    string,
    AdminTableColumnConfig
  >

const ensureKnownColumns = (
  columnsByDbName: Record<string, AdminTableColumnConfig>,
  values: string[],
  source: string
) => {
  const unknownColumns = values.filter((value) => !columnsByDbName[value])
  if (unknownColumns.length > 0) {
    throw new Error(
      `Unknown admin table columns in ${source}: ${unknownColumns.join(', ')}`
    )
  }
}

const createAdminTableConfig = ({
  label,
  table,
  primaryKeys,
  defaultRow,
  fieldRules = {},
}: AdminTableDefinitionInput): AdminTableConfig => {
  const columns = buildColumns(table)
  const columnsByDbName = toColumnsByDbName(columns)

  ensureKnownColumns(columnsByDbName, primaryKeys, `${label} primaryKeys`)
  ensureKnownColumns(
    columnsByDbName,
    Object.keys(defaultRow || {}),
    `${label} defaultRow`
  )
  ensureKnownColumns(
    columnsByDbName,
    Object.keys(fieldRules),
    `${label} fieldRules`
  )

  return {
    label,
    table,
    primaryKeys,
    defaultRow,
    columns,
    columnsByDbName,
    fieldRules,
  }
}

const positiveIdRule = integerRule({ min: 1 })
const orderIndexRule = integerRule({ min: 1 })

export const ADMIN_TABLES: AdminTablesMap = {
  profile: createAdminTableConfig({
    label: 'Profile',
    table: schema.profile,
    primaryKeys: ['id'],
    defaultRow: { id: 1 },
    fieldRules: {
      id: positiveIdRule,
      full_name: requiredTextRule(),
      photo_url: optionalUrlRule(),
      email: optionalEmailRule(),
      cv_url: optionalUrlRule(),
      university_logo_url: optionalUrlRule(),
    },
  }),
  profile_i18n: createAdminTableConfig({
    label: 'Profile i18n',
    table: schema.profileI18n,
    primaryKeys: ['profile_id', 'locale'],
    defaultRow: { profile_id: 1, locale: 'it' },
    fieldRules: {
      profile_id: positiveIdRule,
      locale: localeRule(),
      greeting: requiredTextRule(),
      location: requiredTextRule(),
      university_name: requiredTextRule(),
      bio: optionalTextRule(),
    },
  }),
  social_links: createAdminTableConfig({
    label: 'Social links',
    table: schema.socialLinks,
    primaryKeys: ['profile_id', 'order_index'],
    defaultRow: { profile_id: 1, order_index: 1, name: '', url: '', icon_key: '' },
    fieldRules: {
      id: positiveIdRule,
      profile_id: positiveIdRule,
      order_index: orderIndexRule,
      name: requiredTextRule(),
      url: requiredUrlRule(),
      icon_key: requiredTextRule(),
    },
  }),
  hero_roles: createAdminTableConfig({
    label: 'Hero roles',
    table: schema.heroRoles,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      order_index: orderIndexRule,
    },
  }),
  hero_roles_i18n: createAdminTableConfig({
    label: 'Hero roles i18n',
    table: schema.heroRolesI18n,
    primaryKeys: ['hero_role_id', 'locale'],
    defaultRow: { hero_role_id: 1, locale: 'it', role: '' },
    fieldRules: {
      hero_role_id: positiveIdRule,
      locale: localeRule(),
      role: requiredTextRule(),
    },
  }),
  about_interests: createAdminTableConfig({
    label: 'About interests',
    table: schema.aboutInterests,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      order_index: orderIndexRule,
    },
  }),
  about_interests_i18n: createAdminTableConfig({
    label: 'About interests i18n',
    table: schema.aboutInterestsI18n,
    primaryKeys: ['about_interest_id', 'locale'],
    defaultRow: { about_interest_id: 1, locale: 'it', interest: '' },
    fieldRules: {
      about_interest_id: positiveIdRule,
      locale: localeRule(),
      interest: requiredTextRule(),
    },
  }),
  projects: createAdminTableConfig({
    label: 'Projects',
    table: schema.projects,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1, slug: '' },
    fieldRules: {
      id: positiveIdRule,
      slug: requiredTextRule(),
      order_index: orderIndexRule,
      live_url: optionalUrlRule(),
    },
  }),
  github_projects: createAdminTableConfig({
    label: 'GitHub projects',
    table: schema.githubProjects,
    primaryKeys: ['id'],
    defaultRow: {
      order_index: 1,
      slug: '',
      github_url: '',
      live_url: '',
      image_url: '',
      featured: true,
    },
    fieldRules: {
      id: positiveIdRule,
      slug: requiredTextRule(),
      order_index: orderIndexRule,
      github_url: requiredUrlRule(),
      live_url: optionalUrlRule(),
      image_url: optionalUrlRule(),
      featured: booleanRule(),
    },
  }),
  projects_i18n: createAdminTableConfig({
    label: 'Projects i18n',
    table: schema.projectsI18n,
    primaryKeys: ['project_id', 'locale'],
    defaultRow: { project_id: 1, locale: 'it', title: '', description: '' },
    fieldRules: {
      project_id: positiveIdRule,
      locale: localeRule(),
      title: requiredTextRule(),
      description: requiredTextRule(),
    },
  }),
  github_projects_i18n: createAdminTableConfig({
    label: 'GitHub projects i18n',
    table: schema.githubProjectsI18n,
    primaryKeys: ['github_project_id', 'locale'],
    defaultRow: { github_project_id: 1, locale: 'it', title: '', description: '' },
    fieldRules: {
      github_project_id: positiveIdRule,
      locale: localeRule(),
      title: requiredTextRule(),
      description: requiredTextRule(),
    },
  }),
  project_tags: createAdminTableConfig({
    label: 'Project tags',
    table: schema.projectTags,
    primaryKeys: ['project_id', 'order_index'],
    defaultRow: { project_id: 1, order_index: 1, tag: '' },
    fieldRules: {
      id: positiveIdRule,
      project_id: positiveIdRule,
      order_index: orderIndexRule,
      tag: requiredTextRule(),
    },
  }),
  github_project_tags: createAdminTableConfig({
    label: 'GitHub project tags',
    table: schema.githubProjectTags,
    primaryKeys: ['github_project_id', 'order_index'],
    defaultRow: { github_project_id: 1, order_index: 1, tag: '' },
    fieldRules: {
      id: positiveIdRule,
      github_project_id: positiveIdRule,
      order_index: orderIndexRule,
      tag: requiredTextRule(),
    },
  }),
  github_project_images: createAdminTableConfig({
    label: 'GitHub project images',
    table: schema.githubProjectImages,
    primaryKeys: ['id'],
    defaultRow: { github_project_id: 1, order_index: 1, image_url: '', alt_text: '' },
    fieldRules: {
      id: positiveIdRule,
      github_project_id: positiveIdRule,
      order_index: orderIndexRule,
      image_url: requiredUrlRule(),
      alt_text: optionalTextRule(),
    },
  }),
  experiences: createAdminTableConfig({
    label: 'Experiences',
    table: schema.experiences,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      slug: requiredTextRule(),
      order_index: orderIndexRule,
      logo: optionalUrlRule(),
      logo_bg: optionalHexColorRule(),
    },
  }),
  experiences_i18n: createAdminTableConfig({
    label: 'Experiences i18n',
    table: schema.experiencesI18n,
    primaryKeys: ['experience_id', 'locale'],
    defaultRow: {
      experience_id: 1,
      locale: 'it',
      role: '',
      company: '',
      period: '',
      description: '',
    },
    fieldRules: {
      experience_id: positiveIdRule,
      locale: localeRule(),
      role: requiredTextRule(),
      company: requiredTextRule(),
      period: requiredTextRule(),
      description: requiredTextRule(),
    },
  }),
  education: createAdminTableConfig({
    label: 'Education',
    table: schema.education,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      slug: requiredTextRule(),
      order_index: orderIndexRule,
      logo: optionalUrlRule(),
    },
  }),
  education_i18n: createAdminTableConfig({
    label: 'Education i18n',
    table: schema.educationI18n,
    primaryKeys: ['education_id', 'locale'],
    defaultRow: {
      education_id: 1,
      locale: 'it',
      degree: '',
      institution: '',
      period: '',
      description: '',
    },
    fieldRules: {
      education_id: positiveIdRule,
      locale: localeRule(),
      degree: requiredTextRule(),
      institution: requiredTextRule(),
      period: requiredTextRule(),
      description: requiredTextRule(),
    },
  }),
  tech_categories: createAdminTableConfig({
    label: 'Tech categories',
    table: schema.techCategories,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1, slug: '' },
    fieldRules: {
      id: positiveIdRule,
      slug: requiredTextRule(),
      order_index: orderIndexRule,
    },
  }),
  tech_categories_i18n: createAdminTableConfig({
    label: 'Tech categories i18n',
    table: schema.techCategoriesI18n,
    primaryKeys: ['tech_category_id', 'locale'],
    defaultRow: { tech_category_id: 1, locale: 'it', name: '' },
    fieldRules: {
      tech_category_id: positiveIdRule,
      locale: localeRule(),
      name: requiredTextRule(),
    },
  }),
  tech_items: createAdminTableConfig({
    label: 'Tech items',
    table: schema.techItems,
    primaryKeys: ['id'],
    defaultRow: {
      tech_category_id: 1,
      order_index: 1,
      name: '',
      devicon: '',
      color: '#999999',
    },
    fieldRules: {
      id: positiveIdRule,
      tech_category_id: positiveIdRule,
      order_index: orderIndexRule,
      name: requiredTextRule(),
      devicon: optionalTextRule(),
      color: optionalHexColorRule(),
    },
  }),
  skill_categories: createAdminTableConfig({
    label: 'Skill categories',
    table: schema.skillCategories,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      order_index: orderIndexRule,
    },
  }),
  skill_categories_i18n: createAdminTableConfig({
    label: 'Skill categories i18n',
    table: schema.skillCategoriesI18n,
    primaryKeys: ['skill_category_id', 'locale'],
    defaultRow: { skill_category_id: 1, locale: 'it', category_name: '' },
    fieldRules: {
      skill_category_id: positiveIdRule,
      locale: localeRule(),
      category_name: requiredTextRule(),
    },
  }),
  skill_items: createAdminTableConfig({
    label: 'Skill items',
    table: schema.skillItems,
    primaryKeys: ['id'],
    defaultRow: { skill_category_id: 1, order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      skill_category_id: positiveIdRule,
      order_index: orderIndexRule,
    },
  }),
  skill_items_i18n: createAdminTableConfig({
    label: 'Skill items i18n',
    table: schema.skillItemsI18n,
    primaryKeys: ['skill_item_id', 'locale'],
    defaultRow: { skill_item_id: 1, locale: 'it', label: '' },
    fieldRules: {
      skill_item_id: positiveIdRule,
      locale: localeRule(),
      label: requiredTextRule(),
    },
  }),
}

export function getAdminTableConfig(table: string): AdminTableConfig | null {
  return ADMIN_TABLES[table] || null
}
