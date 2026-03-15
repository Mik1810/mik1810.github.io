import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core'

export const locales = pgTable('locales', {
  code: text('code').primaryKey().notNull(),
  label: text('label').notNull(),
})

export const profile = pgTable(
  'profile',
  {
    id: smallint('id').primaryKey().default(1).notNull(),
    fullName: text('full_name').notNull(),
    photoUrl: text('photo_url'),
    email: text('email'),
    cvUrl: text('cv_url'),
    universityLogoUrl: text('university_logo_url'),
  },
  (table) => [check('profile_id_check', sql`${table.id} = 1`)]
)

export const profileI18n = pgTable(
  'profile_i18n',
  {
    profileId: smallint('profile_id').notNull(),
    locale: text('locale').notNull(),
    greeting: text('greeting').notNull(),
    location: text('location').notNull(),
    universityName: text('university_name').notNull(),
    bio: text('bio'),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.locale] })]
)

export const socialLinks = pgTable(
  'social_links',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    profileId: smallint('profile_id').notNull(),
    orderIndex: integer('order_index').notNull(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    iconKey: text('icon_key').notNull(),
  },
  (table) => [
    unique('social_links_profile_id_order_index_key').on(
      table.profileId,
      table.orderIndex
    ),
  ]
)

export const heroRoles = pgTable(
  'hero_roles',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [unique('hero_roles_order_index_key').on(table.orderIndex)]
)

export const heroRolesI18n = pgTable(
  'hero_roles_i18n',
  {
    heroRoleId: bigint('hero_role_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    role: text('role').notNull(),
  },
  (table) => [primaryKey({ columns: [table.heroRoleId, table.locale] })]
)

export const aboutInterests = pgTable(
  'about_interests',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [unique('about_interests_order_index_key').on(table.orderIndex)]
)

export const aboutInterestsI18n = pgTable(
  'about_interests_i18n',
  {
    aboutInterestId: bigint('about_interest_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    interest: text('interest').notNull(),
  },
  (table) => [primaryKey({ columns: [table.aboutInterestId, table.locale] })]
)

export const projects = pgTable(
  'projects',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    slug: text('slug').notNull(),
    orderIndex: integer('order_index').notNull(),
    liveUrl: text('live_url'),
  },
  (table) => [
    unique('projects_order_index_key').on(table.orderIndex),
    unique('projects_slug_key').on(table.slug),
  ]
)

export const projectsI18n = pgTable(
  'projects_i18n',
  {
    projectId: bigint('project_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.locale] })]
)

export const projectTags = pgTable(
  'project_tags',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    projectId: bigint('project_id', { mode: 'number' }).notNull(),
    orderIndex: integer('order_index').notNull(),
    tag: text('tag').notNull(),
  },
  (table) => [
    unique('project_tags_project_id_order_index_key').on(
      table.projectId,
      table.orderIndex
    ),
  ]
)

export const githubProjects = pgTable(
  'github_projects',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    slug: text('slug').notNull(),
    orderIndex: integer('order_index').notNull(),
    githubUrl: text('github_url').notNull(),
    liveUrl: text('live_url'),
    featured: boolean('featured').default(true).notNull(),
  },
  (table) => [
    unique('github_projects_order_index_key').on(table.orderIndex),
    unique('github_projects_slug_key').on(table.slug),
  ]
)

export const githubProjectsI18n = pgTable(
  'github_projects_i18n',
  {
    githubProjectId: bigint('github_project_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
  },
  (table) => [primaryKey({ columns: [table.githubProjectId, table.locale] })]
)

export const githubProjectTags = pgTable(
  'github_project_tags',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    githubProjectId: bigint('github_project_id', { mode: 'number' }).notNull(),
    orderIndex: integer('order_index').notNull(),
    tag: text('tag').notNull(),
  },
  (table) => [
    unique(
      'github_project_tags_github_project_id_order_index_key'
    ).on(table.githubProjectId, table.orderIndex),
  ]
)

export const githubProjectImages = pgTable(
  'github_project_images',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    githubProjectId: bigint('github_project_id', { mode: 'number' }).notNull(),
    orderIndex: integer('order_index').notNull(),
    imageUrl: text('image_url').notNull(),
    altText: text('alt_text'),
  },
  (table) => [
    unique(
      'github_project_images_github_project_id_order_index_key'
    ).on(table.githubProjectId, table.orderIndex),
  ]
)

export const experiences = pgTable(
  'experiences',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    slug: text('slug').notNull(),
    orderIndex: integer('order_index').notNull(),
    logo: text('logo'),
    logoBg: text('logo_bg'),
  },
  (table) => [
    unique('experiences_order_index_key').on(table.orderIndex),
    unique('experiences_slug_key').on(table.slug),
  ]
)

export const experiencesI18n = pgTable(
  'experiences_i18n',
  {
    experienceId: bigint('experience_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    role: text('role').notNull(),
    company: text('company').notNull(),
    period: text('period').notNull(),
    description: text('description').notNull(),
  },
  (table) => [primaryKey({ columns: [table.experienceId, table.locale] })]
)

export const education = pgTable(
  'education',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    slug: text('slug').notNull(),
    orderIndex: integer('order_index').notNull(),
    logo: text('logo'),
  },
  (table) => [
    unique('education_order_index_key').on(table.orderIndex),
    unique('education_slug_key').on(table.slug),
  ]
)

export const educationI18n = pgTable(
  'education_i18n',
  {
    educationId: bigint('education_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    degree: text('degree').notNull(),
    institution: text('institution').notNull(),
    period: text('period').notNull(),
    description: text('description').notNull(),
  },
  (table) => [primaryKey({ columns: [table.educationId, table.locale] })]
)

export const techCategories = pgTable(
  'tech_categories',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    slug: text('slug').notNull(),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [
    unique('tech_categories_order_index_key').on(table.orderIndex),
    unique('tech_categories_slug_key').on(table.slug),
  ]
)

export const techCategoriesI18n = pgTable(
  'tech_categories_i18n',
  {
    techCategoryId: bigint('tech_category_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
  },
  (table) => [primaryKey({ columns: [table.techCategoryId, table.locale] })]
)

export const techItems = pgTable(
  'tech_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    techCategoryId: bigint('tech_category_id', { mode: 'number' }).notNull(),
    orderIndex: integer('order_index').notNull(),
    name: text('name').notNull(),
    devicon: text('devicon'),
    color: text('color'),
  },
  (table) => [
    unique('tech_items_tech_category_id_order_index_key').on(
      table.techCategoryId,
      table.orderIndex
    ),
  ]
)

export const skillCategories = pgTable(
  'skill_categories',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [unique('skill_categories_order_index_key').on(table.orderIndex)]
)

export const skillCategoriesI18n = pgTable(
  'skill_categories_i18n',
  {
    skillCategoryId: bigint('skill_category_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    categoryName: text('category_name').notNull(),
  },
  (table) => [primaryKey({ columns: [table.skillCategoryId, table.locale] })]
)

export const skillItems = pgTable(
  'skill_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    skillCategoryId: bigint('skill_category_id', { mode: 'number' }).notNull(),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => [
    unique('skill_items_skill_category_id_order_index_key').on(
      table.skillCategoryId,
      table.orderIndex
    ),
  ]
)

export const skillItemsI18n = pgTable(
  'skill_items_i18n',
  {
    skillItemId: bigint('skill_item_id', { mode: 'number' }).notNull(),
    locale: text('locale').notNull(),
    label: text('label').notNull(),
  },
  (table) => [primaryKey({ columns: [table.skillItemId, table.locale] })]
)
