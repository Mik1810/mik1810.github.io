import { getTableColumns } from 'drizzle-orm'
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

import type {
  AdminFieldRule,
  AdminFieldEditorConfig,
  AdminTableGroupKey,
  AdminTableColumnConfig,
  AdminTableConfig,
  AdminTableFieldDefinition,
} from '../types/admin.js'

type AdminTableConfigWithoutGroup = Omit<AdminTableConfig, 'group'>

export interface AdminTableDefinitionInput {
  label: string
  table: AnyPgTable
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
  fieldRules?: Record<string, AdminFieldRule>
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

const isSystemColumn = (column: string) =>
  column === 'created_at' || column === 'updated_at'

const isForeignKeyColumn = (column: string) =>
  column.endsWith('_id') && column !== 'id'

const toFieldLabel = (dbName: string) =>
  dbName
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const inferEditor = (dbName: string, rule?: AdminFieldRule): AdminFieldEditorConfig => {
  if (rule?.editor) return rule.editor
  if (dbName === 'id' || dbName.endsWith('_id') || dbName.endsWith('_index')) {
    return { kind: 'number' }
  }
  if (dbName.endsWith('_url') || dbName === 'url' || dbName === 'logo') {
    return { kind: 'url' }
  }
  if (dbName === 'email') {
    return { kind: 'email' }
  }
  if (dbName.includes('description') || dbName.includes('bio')) {
    return { kind: 'textarea', rows: 5 }
  }
  if (dbName.includes('color')) {
    return { kind: 'color' }
  }
  return { kind: 'text' }
}

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

export const createAdminTableConfig = ({
  label,
  table,
  primaryKeys,
  defaultRow,
  fieldRules = {},
}: AdminTableDefinitionInput): AdminTableConfigWithoutGroup => {
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

  const fields: AdminTableFieldDefinition[] = columns.map((column) => ({
    name: column.dbName,
    label: toFieldLabel(column.dbName),
    editor: inferEditor(column.dbName, fieldRules[column.dbName]),
    editable: !isSystemColumn(column.dbName),
    primaryKey: primaryKeys.includes(column.dbName),
    system: isSystemColumn(column.dbName),
    foreignKey: isForeignKeyColumn(column.dbName),
  }))

  return {
    label,
    table,
    primaryKeys,
    defaultRow,
    columns,
    columnsByDbName,
    fieldRules,
    fields,
  }
}

export const attachAdminGroup = (
  group: AdminTableGroupKey,
  tables: Record<string, AdminTableConfigWithoutGroup>
) =>
  Object.fromEntries(
    Object.entries(tables).map(([name, config]) => [
      name,
      {
        ...config,
        group,
      },
    ])
  ) as Record<string, AdminTableConfig>
