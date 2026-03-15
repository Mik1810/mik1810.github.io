import * as schema from '../../db/schema.js'
import { attachAdminGroup, createAdminTableConfig } from '../registry.js'
import {
  booleanRule,
  localeRule,
  optionalTextRule,
  optionalUrlRule,
  orderIndexRule,
  positiveIdRule,
  requiredTextRule,
  requiredUrlRule,
  withEditor,
} from '../rules.js'

export const PROJECT_ADMIN_TABLES = attachAdminGroup('projects', {
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
      description: withEditor(requiredTextRule(), { kind: 'textarea', rows: 5 }),
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
      description: withEditor(requiredTextRule(), { kind: 'textarea', rows: 5 }),
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
})
