import { getTableColumns } from 'drizzle-orm'
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

import type {
  AdminFieldRule,
  AdminTableColumnConfig,
  AdminTableConfig,
} from '../types/admin.js'

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
