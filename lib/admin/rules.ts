import type { AdminFieldEditorConfig, AdminFieldRule } from '../types/admin.js'

const SUPPORTED_LOCALES = new Set(['it', 'en'])
const LOCALE_OPTIONS = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
] as const

const trimString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value

const isUrlLike = (value: string) => {
  if (value.startsWith('/')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const isEmailLike = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const integerRule = ({
  min,
}: {
  min?: number
} = {}): AdminFieldRule => ({
  editor: { kind: 'number' },
  normalize: (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^-?\d+$/.test(trimmed)) {
        return Number.parseInt(trimmed, 10)
      }
    }
    return value
  },
  validate: (value, context) => {
    if (!Number.isInteger(value)) {
      throw new Error(`${context.column.dbName} must be an integer`)
    }
    if (min !== undefined && (value as number) < min) {
      throw new Error(`${context.column.dbName} must be >= ${min}`)
    }
  },
})

export const requiredTextRule = (): AdminFieldRule => ({
  editor: { kind: 'text' },
  normalize: (value) => trimString(value),
  validate: (value, context) => {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`${context.column.dbName} cannot be empty`)
    }
  },
})

export const optionalTextRule = (): AdminFieldRule => ({
  editor: { kind: 'text' },
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value !== null && typeof value !== 'string') {
      throw new Error(`${context.column.dbName} must be a string or null`)
    }
  },
})

export const localeRule = (): AdminFieldRule => ({
  editor: { kind: 'select', options: [...LOCALE_OPTIONS] },
  normalize: (value) => trimString(value),
  validate: (value, context) => {
    if (typeof value !== 'string' || !SUPPORTED_LOCALES.has(value)) {
      throw new Error(
        `${context.column.dbName} must be one of: ${Array.from(
          SUPPORTED_LOCALES
        ).join(', ')}`
      )
    }
  },
})

export const booleanRule = (): AdminFieldRule => ({
  editor: { kind: 'checkbox' },
  normalize: (value) => {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
    return value
  },
  validate: (value, context) => {
    if (typeof value !== 'boolean') {
      throw new Error(`${context.column.dbName} must be a boolean`)
    }
  },
})

export const optionalUrlRule = (): AdminFieldRule => ({
  editor: { kind: 'url' },
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value === null) return
    if (typeof value !== 'string' || !isUrlLike(value)) {
      throw new Error(`${context.column.dbName} must be a valid URL or path`)
    }
  },
})

export const requiredUrlRule = (): AdminFieldRule => ({
  editor: { kind: 'url' },
  normalize: (value) => trimString(value),
  validate: (value, context) => {
    if (typeof value !== 'string' || value.length === 0 || !isUrlLike(value)) {
      throw new Error(`${context.column.dbName} must be a valid URL or path`)
    }
  },
})

export const optionalEmailRule = (): AdminFieldRule => ({
  editor: { kind: 'email' },
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value === null) return
    if (typeof value !== 'string' || !isEmailLike(value)) {
      throw new Error(`${context.column.dbName} must be a valid email`)
    }
  },
})

export const optionalHexColorRule = (): AdminFieldRule => ({
  editor: { kind: 'color' },
  normalize: (value) => {
    const normalized = trimString(value)
    return normalized === '' ? null : normalized
  },
  validate: (value, context) => {
    if (value === null) return
    if (
      typeof value !== 'string' ||
      !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
    ) {
      throw new Error(`${context.column.dbName} must be a valid hex color`)
    }
  },
})

export const positiveIdRule = integerRule({ min: 1 })
export const orderIndexRule = integerRule({ min: 1 })

export const withEditor = (
  rule: AdminFieldRule,
  editor: AdminFieldEditorConfig
): AdminFieldRule => ({
  ...rule,
  editor,
})
