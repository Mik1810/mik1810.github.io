import { sqlClient } from '../db/client.js'
import {
  appEnv,
  getAdminEnvironmentSnapshot,
  type AdminEnvironmentVariableSnapshot,
} from '../config/env.js'
import {
  appMetadata,
  getDeploymentMetadata,
  getUptimeSeconds,
} from '../appMetadata.js'

export interface DatabaseHealthCheck {
  ok: boolean
  latencyMs: number | null
}

export interface PublicHealthPayload {
  ok: boolean
  service: 'api'
  timestamp: string
  app: {
    name: string
    version: string
  }
  checks: {
    database: DatabaseHealthCheck
  }
}

export interface AdminHealthPayload extends PublicHealthPayload {
  environment: string
  app: PublicHealthPayload['app'] & {
    uptimeSeconds: number
    startedAt: string
  }
  deployment: ReturnType<typeof getDeploymentMetadata>
  environmentVariables: AdminEnvironmentVariableSnapshot[]
}

export const runDatabaseHealthCheck = async (): Promise<DatabaseHealthCheck> => {
  const startedAt = Date.now()

  try {
    await sqlClient`select 1 as ok`
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
    }
  } catch {
    return {
      ok: false,
      latencyMs: null,
    }
  }
}

export const createPublicHealthPayload = (
  database: DatabaseHealthCheck
): PublicHealthPayload => ({
  ok: database.ok,
  service: 'api',
  timestamp: new Date().toISOString(),
  app: {
    name: appMetadata.name,
    version: appMetadata.version,
  },
  checks: {
    database,
  },
})

export const createAdminHealthPayload = (
  database: DatabaseHealthCheck
): AdminHealthPayload => ({
  ...createPublicHealthPayload(database),
  environment: appEnv.nodeEnv,
  app: {
    name: appMetadata.name,
    version: appMetadata.version,
    uptimeSeconds: getUptimeSeconds(),
    startedAt: appMetadata.startedAt.toISOString(),
  },
  deployment: getDeploymentMetadata(),
  environmentVariables: getAdminEnvironmentSnapshot(),
})
