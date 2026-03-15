import * as schema from '../../db/schema.js'
import { attachAdminGroup, createAdminTableConfig } from '../registry.js'
import {
  localeRule,
  optionalEmailRule,
  optionalTextRule,
  optionalUrlRule,
  orderIndexRule,
  positiveIdRule,
  requiredTextRule,
  requiredUrlRule,
} from '../rules.js'

export const PROFILE_ADMIN_TABLES = attachAdminGroup('profile', {
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
})
