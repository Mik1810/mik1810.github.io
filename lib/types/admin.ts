import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

export type AdminTableGroupKey = 'profile' | 'projects' | 'experiences' | 'skills'

export interface AdminTableGroupDefinition {
  key: AdminTableGroupKey
  label: string
}

export interface AdminTableColumnConfig {
  dbName: string
  propertyKey: string
  column: AnyPgColumn
}

export type AdminFieldEditorKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'email'
  | 'checkbox'
  | 'color'
  | 'select'

export interface AdminFieldEditorOption {
  value: string
  label: string
}

export interface AdminFieldRelationConfig {
  table: string
  valueColumn?: string
  labelColumns: string[]
  emptyLabel?: string
}

export interface AdminFieldEditorConfig {
  kind: AdminFieldEditorKind
  rows?: number
  options?: AdminFieldEditorOption[]
  relation?: AdminFieldRelationConfig
}

export type AdminPayloadKind = 'keys' | 'row'
export type AdminPayloadOperation = 'create' | 'update' | 'delete'

export interface AdminFieldRuleContext {
  column: AdminTableColumnConfig
  tableName: string
  payloadKind: AdminPayloadKind
  operation: AdminPayloadOperation
}

export interface AdminFieldRule {
  normalize?: (value: unknown, context: AdminFieldRuleContext) => unknown
  validate?: (value: unknown, context: AdminFieldRuleContext) => void
  editor?: AdminFieldEditorConfig
}

export interface AdminTableFieldDefinition {
  name: string
  label: string
  editor: AdminFieldEditorConfig
  editable: boolean
  primaryKey: boolean
  system: boolean
  foreignKey: boolean
}

export interface AdminTableConfig {
  group: AdminTableGroupKey
  subgroup: string
  subgroupLabel: string
  label: string
  description?: string
  table: AnyPgTable
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
  columns: AdminTableColumnConfig[]
  columnsByDbName: Record<string, AdminTableColumnConfig>
  fieldRules: Record<string, AdminFieldRule>
  fields: AdminTableFieldDefinition[]
}

export type AdminTablesMap = Record<string, AdminTableConfig>

export interface AdminSessionResponse {
  authenticated: boolean
  user: {
    id: string
    email: string
  } | null
}
