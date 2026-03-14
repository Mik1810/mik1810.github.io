import type { AdminTableConfig, AdminTablesMap } from './types/admin.js'

export const ADMIN_TABLES: AdminTablesMap = {
  profile: {
    label: 'Profile',
    primaryKeys: ['id'],
    defaultRow: { id: 1 },
  },
  profile_i18n: {
    label: 'Profile i18n',
    primaryKeys: ['profile_id', 'locale'],
    defaultRow: { profile_id: 1, locale: 'it' },
  },
  social_links: {
    label: 'Social links',
    primaryKeys: ['profile_id', 'order_index'],
    defaultRow: { profile_id: 1, order_index: 1, name: '', url: '', icon_key: '' },
  },
  hero_roles: {
    label: 'Hero roles',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  },
  hero_roles_i18n: {
    label: 'Hero roles i18n',
    primaryKeys: ['hero_role_id', 'locale'],
    defaultRow: { hero_role_id: 1, locale: 'it', role: '' },
  },
  about_interests: {
    label: 'About interests',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  },
  about_interests_i18n: {
    label: 'About interests i18n',
    primaryKeys: ['about_interest_id', 'locale'],
    defaultRow: { about_interest_id: 1, locale: 'it', interest: '' },
  },
  projects: {
    label: 'Projects',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1, slug: '' },
  },
  github_projects: {
    label: 'GitHub projects',
    primaryKeys: ['id'],
    defaultRow: {
      order_index: 1,
      slug: '',
      github_url: '',
      live_url: '',
      image_url: '',
      featured: true,
    },
  },
  projects_i18n: {
    label: 'Projects i18n',
    primaryKeys: ['project_id', 'locale'],
    defaultRow: { project_id: 1, locale: 'it', title: '', description: '' },
  },
  github_projects_i18n: {
    label: 'GitHub projects i18n',
    primaryKeys: ['github_project_id', 'locale'],
    defaultRow: { github_project_id: 1, locale: 'it', title: '', description: '' },
  },
  project_tags: {
    label: 'Project tags',
    primaryKeys: ['project_id', 'order_index'],
    defaultRow: { project_id: 1, order_index: 1, tag: '' },
  },
  github_project_tags: {
    label: 'GitHub project tags',
    primaryKeys: ['github_project_id', 'order_index'],
    defaultRow: { github_project_id: 1, order_index: 1, tag: '' },
  },
  github_project_images: {
    label: 'GitHub project images',
    primaryKeys: ['id'],
    defaultRow: { github_project_id: 1, order_index: 1, image_url: '', alt_text: '' },
  },
  experiences: {
    label: 'Experiences',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  },
  experiences_i18n: {
    label: 'Experiences i18n',
    primaryKeys: ['experience_id', 'locale'],
    defaultRow: {
      experience_id: 1,
      locale: 'it',
      role: '',
      company: '',
      period: '',
      description: '',
    },
  },
  education: {
    label: 'Education',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  },
  education_i18n: {
    label: 'Education i18n',
    primaryKeys: ['education_id', 'locale'],
    defaultRow: {
      education_id: 1,
      locale: 'it',
      degree: '',
      institution: '',
      period: '',
      description: '',
    },
  },
  tech_categories: {
    label: 'Tech categories',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1, slug: '' },
  },
  tech_categories_i18n: {
    label: 'Tech categories i18n',
    primaryKeys: ['tech_category_id', 'locale'],
    defaultRow: { tech_category_id: 1, locale: 'it', name: '' },
  },
  tech_items: {
    label: 'Tech items',
    primaryKeys: ['id'],
    defaultRow: {
      tech_category_id: 1,
      order_index: 1,
      name: '',
      devicon: '',
      color: '#999999',
    },
  },
  skill_categories: {
    label: 'Skill categories',
    primaryKeys: ['id'],
    defaultRow: { order_index: 1 },
  },
  skill_categories_i18n: {
    label: 'Skill categories i18n',
    primaryKeys: ['skill_category_id', 'locale'],
    defaultRow: { skill_category_id: 1, locale: 'it', category_name: '' },
  },
  skill_items: {
    label: 'Skill items',
    primaryKeys: ['id'],
    defaultRow: { skill_category_id: 1, order_index: 1 },
  },
  skill_items_i18n: {
    label: 'Skill items i18n',
    primaryKeys: ['skill_item_id', 'locale'],
    defaultRow: { skill_item_id: 1, locale: 'it', label: '' },
  },
}

export function getAdminTableConfig(table: string): AdminTableConfig | null {
  return ADMIN_TABLES[table] || null
}
