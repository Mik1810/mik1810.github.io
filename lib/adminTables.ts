import { getTableColumns } from 'drizzle-orm'
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

import * as schema from './db/schema.js'
import type {
  AdminTableColumnConfig,
  AdminTableConfig,
  AdminTablesMap,
} from './types/admin.js'

interface AdminTableDefinitionInput {
  label: string
  table: AnyPgTable
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
}

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
}: AdminTableDefinitionInput): AdminTableConfig => {
  const columns = buildColumns(table)
  const columnsByDbName = toColumnsByDbName(columns)

  ensureKnownColumns(columnsByDbName, primaryKeys, `${label} primaryKeys`)
  ensureKnownColumns(
    columnsByDbName,
    Object.keys(defaultRow || {}),
    `${label} defaultRow`
  )

  return {
    label,
    table,
    primaryKeys,
    defaultRow,
    columns,
    columnsByDbName,
  }
}

export const ADMIN_TABLES: AdminTablesMap = {
  profile: createAdminTableConfig({
    label: 'Profile',
    table: schema.profile,
    primaryKeys: ['id'],
    defaultRow: { id: 1 },
  }),
  profile_i18n: createAdminTableConfig({
    label: 'Profile i18n',
    table: schema.profileI18n,
    primaryKeys: ['profile_id', 'locale'],
    defaultRow: { profile_id: 1, locale: 'it' },
  }),
  social_links: createAdminTableConfig({
    label: 'Social links',
    table: schema.socialLinks,
    primaryKeys: ['profile_id', 'order_index'],
    defaultRow: { profile_id: 1, order_index: 1, name: '', url: '', icon_key: '' },
  }),
  hero_roles: createAdminTableConfig({
    label: 'Hero roles',
    table: schema.heroRoles,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  }),
  hero_roles_i18n: createAdminTableConfig({
    label: 'Hero roles i18n',
    table: schema.heroRolesI18n,
    primaryKeys: ['hero_role_id', 'locale'],
    defaultRow: { hero_role_id: 1, locale: 'it', role: '' },
  }),
  about_interests: createAdminTableConfig({
    label: 'About interests',
    table: schema.aboutInterests,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  }),
  about_interests_i18n: createAdminTableConfig({
    label: 'About interests i18n',
    table: schema.aboutInterestsI18n,
    primaryKeys: ['about_interest_id', 'locale'],
    defaultRow: { about_interest_id: 1, locale: 'it', interest: '' },
  }),
  projects: createAdminTableConfig({
    label: 'Projects',
    table: schema.projects,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1, slug: '' },
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
  }),
  projects_i18n: createAdminTableConfig({
    label: 'Projects i18n',
    table: schema.projectsI18n,
    primaryKeys: ['project_id', 'locale'],
    defaultRow: { project_id: 1, locale: 'it', title: '', description: '' },
  }),
  github_projects_i18n: createAdminTableConfig({
    label: 'GitHub projects i18n',
    table: schema.githubProjectsI18n,
    primaryKeys: ['github_project_id', 'locale'],
    defaultRow: { github_project_id: 1, locale: 'it', title: '', description: '' },
  }),
  project_tags: createAdminTableConfig({
    label: 'Project tags',
    table: schema.projectTags,
    primaryKeys: ['project_id', 'order_index'],
    defaultRow: { project_id: 1, order_index: 1, tag: '' },
  }),
  github_project_tags: createAdminTableConfig({
    label: 'GitHub project tags',
    table: schema.githubProjectTags,
    primaryKeys: ['github_project_id', 'order_index'],
    defaultRow: { github_project_id: 1, order_index: 1, tag: '' },
  }),
  github_project_images: createAdminTableConfig({
    label: 'GitHub project images',
    table: schema.githubProjectImages,
    primaryKeys: ['id'],
    defaultRow: { github_project_id: 1, order_index: 1, image_url: '', alt_text: '' },
  }),
  experiences: createAdminTableConfig({
    label: 'Experiences',
    table: schema.experiences,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
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
  }),
  education: createAdminTableConfig({
    label: 'Education',
    table: schema.education,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
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
  }),
  tech_categories: createAdminTableConfig({
    label: 'Tech categories',
    table: schema.techCategories,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1, slug: '' },
  }),
  tech_categories_i18n: createAdminTableConfig({
    label: 'Tech categories i18n',
    table: schema.techCategoriesI18n,
    primaryKeys: ['tech_category_id', 'locale'],
    defaultRow: { tech_category_id: 1, locale: 'it', name: '' },
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
  }),
  skill_categories: createAdminTableConfig({
    label: 'Skill categories',
    table: schema.skillCategories,
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  }),
  skill_categories_i18n: createAdminTableConfig({
    label: 'Skill categories i18n',
    table: schema.skillCategoriesI18n,
    primaryKeys: ['skill_category_id', 'locale'],
    defaultRow: { skill_category_id: 1, locale: 'it', category_name: '' },
  }),
  skill_items: createAdminTableConfig({
    label: 'Skill items',
    table: schema.skillItems,
    primaryKeys: ['id'],
    defaultRow: { skill_category_id: 1, order_index: 1 },
  }),
  skill_items_i18n: createAdminTableConfig({
    label: 'Skill items i18n',
    table: schema.skillItemsI18n,
    primaryKeys: ['skill_item_id', 'locale'],
    defaultRow: { skill_item_id: 1, locale: 'it', label: '' },
  }),
}

export function getAdminTableConfig(table: string): AdminTableConfig | null {
  return ADMIN_TABLES[table] || null
}
