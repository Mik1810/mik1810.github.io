import * as schema from '../../db/schema.js'
import { attachAdminGroup, createAdminTableConfig } from '../registry.js'
import {
  localeRule,
  optionalHexColorRule,
  optionalUrlRule,
  orderIndexRule,
  positiveIdRule,
  requiredTextRule,
  withEditor,
} from '../rules.js'

export const EXPERIENCE_ADMIN_TABLES = attachAdminGroup('experiences', {
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
      description: withEditor(requiredTextRule(), { kind: 'textarea', rows: 5 }),
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
      description: withEditor(requiredTextRule(), { kind: 'textarea', rows: 5 }),
    },
  }),
})
