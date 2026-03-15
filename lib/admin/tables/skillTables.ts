import * as schema from '../../db/schema.js'
import { attachAdminGroup, createAdminTableConfig } from '../registry.js'
import {
  localeRule,
  optionalHexColorRule,
  optionalTextRule,
  orderIndexRule,
  positiveIdRule,
  requiredTextRule,
  withRelationSelect,
} from '../rules.js'

export const SKILL_ADMIN_TABLES = attachAdminGroup('skills', {
  tech_categories: createAdminTableConfig({
    label: 'Tech categories',
    subgroup: 'tech_categories',
    subgroupLabel: 'Tech categories',
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
    subgroup: 'tech_categories',
    subgroupLabel: 'Tech categories',
    table: schema.techCategoriesI18n,
    primaryKeys: ['tech_category_id', 'locale'],
    defaultRow: { tech_category_id: 1, locale: 'it', name: '' },
    fieldRules: {
      tech_category_id: withRelationSelect(positiveIdRule, {
        table: 'tech_categories',
        labelColumns: ['slug'],
        emptyLabel: 'Seleziona la categoria tech',
      }),
      locale: localeRule(),
      name: requiredTextRule(),
    },
  }),
  tech_items: createAdminTableConfig({
    label: 'Tech items',
    subgroup: 'tech_items',
    subgroupLabel: 'Tech items',
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
      tech_category_id: withRelationSelect(positiveIdRule, {
        table: 'tech_categories',
        labelColumns: ['slug'],
        emptyLabel: 'Seleziona la categoria tech',
      }),
      order_index: orderIndexRule,
      name: requiredTextRule(),
      devicon: optionalTextRule(),
      color: optionalHexColorRule(),
    },
  }),
  skill_categories: createAdminTableConfig({
    label: 'Skill categories',
    description:
      'Definisce solo l’ordine delle categorie skill mostrate nella sezione Skills. Il nome visibile di ogni categoria si gestisce in Skill categories i18n.',
    subgroup: 'skill_categories',
    subgroupLabel: 'Skill categories',
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
    subgroup: 'skill_categories',
    subgroupLabel: 'Skill categories',
    table: schema.skillCategoriesI18n,
    primaryKeys: ['skill_category_id', 'locale'],
    defaultRow: { skill_category_id: 1, locale: 'it', category_name: '' },
    fieldRules: {
      skill_category_id: withRelationSelect(positiveIdRule, {
        table: 'skill_categories',
        labelColumns: ['order_index'],
        emptyLabel: 'Seleziona la categoria skill',
      }),
      locale: localeRule(),
      category_name: requiredTextRule(),
    },
  }),
  skill_items: createAdminTableConfig({
    label: 'Skill items',
    description:
      'Definisce l’ordine delle singole skill all’interno di una categoria. L’etichetta visibile si gestisce in Skill items i18n.',
    subgroup: 'skill_items',
    subgroupLabel: 'Skill items',
    table: schema.skillItems,
    primaryKeys: ['id'],
    defaultRow: { skill_category_id: 1, order_index: 1 },
    fieldRules: {
      id: positiveIdRule,
      skill_category_id: withRelationSelect(positiveIdRule, {
        table: 'skill_categories',
        labelColumns: ['order_index'],
        emptyLabel: 'Seleziona la categoria skill',
      }),
      order_index: orderIndexRule,
    },
  }),
  skill_items_i18n: createAdminTableConfig({
    label: 'Skill items i18n',
    subgroup: 'skill_items',
    subgroupLabel: 'Skill items',
    table: schema.skillItemsI18n,
    primaryKeys: ['skill_item_id', 'locale'],
    defaultRow: { skill_item_id: 1, locale: 'it', label: '' },
    fieldRules: {
      skill_item_id: withRelationSelect(positiveIdRule, {
        table: 'skill_items',
        labelColumns: ['order_index'],
        emptyLabel: 'Seleziona la skill',
      }),
      locale: localeRule(),
      label: requiredTextRule(),
    },
  }),
})
