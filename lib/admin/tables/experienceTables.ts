import * as schema from '../../db/schema.js'
import { attachAdminGroup, createAdminTableConfig } from '../registry.js'
import {
  localeRule,
  optionalHexColorRule,
  optionalUrlRule,
  orderIndexRule,
  positiveIdRule,
  requiredTextRule,
  withRelationSelect,
  withEditor,
} from '../rules.js'

export const EXPERIENCE_ADMIN_TABLES = attachAdminGroup('experiences', {
  experiences: createAdminTableConfig({
    label: 'Experiences',
    subgroup: 'experiences',
    subgroupLabel: 'Experiences',
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
    subgroup: 'experiences',
    subgroupLabel: 'Experiences',
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
      experience_id: withRelationSelect(positiveIdRule, {
        table: 'experiences',
        labelColumns: ['slug'],
        emptyLabel: 'Seleziona l’esperienza',
      }),
      locale: localeRule(),
      role: requiredTextRule(),
      company: requiredTextRule(),
      period: requiredTextRule(),
      description: withEditor(requiredTextRule(), { kind: 'textarea', rows: 5 }),
    },
  }),
  education: createAdminTableConfig({
    label: 'Education',
    subgroup: 'education',
    subgroupLabel: 'Education',
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
    subgroup: 'education',
    subgroupLabel: 'Education',
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
      education_id: withRelationSelect(positiveIdRule, {
        table: 'education',
        labelColumns: ['slug'],
        emptyLabel: 'Seleziona il percorso',
      }),
      locale: localeRule(),
      degree: requiredTextRule(),
      institution: requiredTextRule(),
      period: requiredTextRule(),
      description: withEditor(requiredTextRule(), { kind: 'textarea', rows: 5 }),
    },
  }),
})
