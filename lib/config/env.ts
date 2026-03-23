import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv({ path: '.env.local', quiet: true })
loadEnv({ quiet: true })

const emailStringSchema = z.string().trim().email()
const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}
const optionalTrimmedString = () =>
  z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional())
const optionalUrlString = () =>
  z.preprocess(emptyStringToUndefined, z.string().trim().url().optional())
const optionalBooleanString = () =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().toLowerCase().optional()
  )

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  API_PORT: z.coerce.number().int().positive().max(65535).optional(),
  DEV_API_WARMUP: optionalBooleanString(),
  DEV_API_DEBUG_LOGS: optionalBooleanString(),
  DB_POOL_MAX: z.coerce.number().int().positive().max(30).optional(),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).optional(),
  AUTH_SESSION_SECRET: optionalTrimmedString(),
  DATABASE_URL: optionalTrimmedString(),
  SUPABASE_URL: optionalUrlString(),
  SUPABASE_SECRET_KEY: optionalTrimmedString(),
  RESEND_API_KEY: optionalTrimmedString(),
  CONTACT_FROM_EMAIL: optionalTrimmedString(),
  CONTACT_TO_EMAIL: optionalTrimmedString(),
})

const env = envSchema.parse(process.env)

export interface AdminEnvironmentVariableSnapshot {
  key: string
  value: string | null
  isSecret: boolean
}

export const appEnv = Object.freeze({
  nodeEnv: env.NODE_ENV ?? 'development',
  isProduction: (env.NODE_ENV ?? 'development') === 'production',
  apiPort: env.API_PORT ?? 3000,
  devApiWarmup:
    env.DEV_API_WARMUP === '1' ||
    env.DEV_API_WARMUP === 'true' ||
    env.DEV_API_WARMUP === 'yes',
  devApiDebugLogs:
    env.DEV_API_DEBUG_LOGS === undefined
      ? (env.NODE_ENV ?? 'development') !== 'production'
      : env.DEV_API_DEBUG_LOGS === '1' ||
        env.DEV_API_DEBUG_LOGS === 'true' ||
        env.DEV_API_DEBUG_LOGS === 'yes',
  dbPoolMax: env.DB_POOL_MAX ?? 4,
  dbStatementTimeoutMs: env.DB_STATEMENT_TIMEOUT_MS ?? 20000,
})

const serializeEnvValue = (value: string | number | undefined) => {
  if (typeof value === 'number') {
    return String(value)
  }

  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export const getAdminEnvironmentSnapshot =
  (): AdminEnvironmentVariableSnapshot[] => [
    {
      key: 'NODE_ENV',
      value: appEnv.nodeEnv,
      isSecret: false,
    },
    {
      key: 'API_PORT',
      value: serializeEnvValue(appEnv.apiPort),
      isSecret: false,
    },
    {
      key: 'DEV_API_WARMUP',
      value: serializeEnvValue(appEnv.devApiWarmup ? 'true' : 'false'),
      isSecret: false,
    },
    {
      key: 'DEV_API_DEBUG_LOGS',
      value: serializeEnvValue(appEnv.devApiDebugLogs ? 'true' : 'false'),
      isSecret: false,
    },
    {
      key: 'DB_POOL_MAX',
      value: serializeEnvValue(appEnv.dbPoolMax),
      isSecret: false,
    },
    {
      key: 'DB_STATEMENT_TIMEOUT_MS',
      value: serializeEnvValue(appEnv.dbStatementTimeoutMs),
      isSecret: false,
    },
    {
      key: 'AUTH_SESSION_SECRET',
      value: serializeEnvValue(env.AUTH_SESSION_SECRET),
      isSecret: true,
    },
    {
      key: 'DATABASE_URL',
      value: serializeEnvValue(env.DATABASE_URL),
      isSecret: true,
    },
    {
      key: 'SUPABASE_URL',
      value: serializeEnvValue(env.SUPABASE_URL),
      isSecret: false,
    },
    {
      key: 'SUPABASE_SECRET_KEY',
      value: serializeEnvValue(env.SUPABASE_SECRET_KEY),
      isSecret: true,
    },
    {
      key: 'RESEND_API_KEY',
      value: serializeEnvValue(env.RESEND_API_KEY),
      isSecret: true,
    },
    {
      key: 'CONTACT_FROM_EMAIL',
      value: serializeEnvValue(env.CONTACT_FROM_EMAIL),
      isSecret: false,
    },
    {
      key: 'CONTACT_TO_EMAIL',
      value: serializeEnvValue(env.CONTACT_TO_EMAIL),
      isSecret: false,
    },
  ]

export const getDatabaseUrl = () => {
  const connectionString = env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'Missing DATABASE_URL. Drizzle requires a PostgreSQL DSN and cannot use SUPABASE_URL, which is the HTTP project endpoint.'
    )
  }

  if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
    throw new Error(
      'Invalid database connection string. Expected a PostgreSQL DSN in DATABASE_URL.'
    )
  }

  return connectionString
}

export const getSupabaseAuthConfig = () => {
  if (!env.SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL')
  }

  const supabaseSecretKey = env.SUPABASE_SECRET_KEY

  if (!supabaseSecretKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY')
  }

  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseSecretKey,
  }
}

export const getAuthSessionSecret = () => {
  if (env.AUTH_SESSION_SECRET) {
    return env.AUTH_SESSION_SECRET
  }

  if (appEnv.isProduction) {
    throw new Error('Missing AUTH_SESSION_SECRET')
  }

  return 'dev-only-insecure-secret-change-me'
}

export const getContactEmailConfig = () => {
  if (!env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY')
  }

  if (!env.CONTACT_FROM_EMAIL) {
    throw new Error('Missing CONTACT_FROM_EMAIL')
  }

  if (!env.CONTACT_TO_EMAIL) {
    throw new Error('Missing CONTACT_TO_EMAIL')
  }

  const fromEmail = emailStringSchema.safeParse(env.CONTACT_FROM_EMAIL)
  if (!fromEmail.success) {
    throw new Error('Invalid CONTACT_FROM_EMAIL')
  }

  const toEmail = emailStringSchema.safeParse(env.CONTACT_TO_EMAIL)
  if (!toEmail.success) {
    throw new Error('Invalid CONTACT_TO_EMAIL')
  }

  return {
    resendApiKey: env.RESEND_API_KEY,
    contactFromEmail: fromEmail.data,
    contactToEmail: toEmail.data,
  }
}
