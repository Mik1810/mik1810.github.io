import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../context/useAuth'
import type {
  AdminDbLatencyMetricResponse,
  AdminEnvironmentVariable,
  AdminEnvironmentResponse,
  AdminHealthResponse,
  AdminTableDefinition,
  AdminTablesResponse,
} from '../../types/app.js'
import AdminHomeDatabaseCard from './admin-home/AdminHomeDatabaseCard'
import AdminHomeEnvironmentCard from './admin-home/AdminHomeEnvironmentCard'
import AdminHomeHero from './admin-home/AdminHomeHero'
import AdminHomeInfoCards from './admin-home/AdminHomeInfoCards'
import '../css/AdminAuth.css'
import '../css/AdminHomeLayout.css'
import '../css/AdminHomeCards.css'

interface DashboardSnapshot {
  health: AdminHealthResponse | null
  tables: AdminTableDefinition[]
  environmentVariables: AdminEnvironmentVariable[]
}

interface DbLatencySample {
  timestamp: string
  latencyMs: number | null
  ok: boolean
}

const DB_LATENCY_POLL_INTERVAL_MS = 5000
const DB_LATENCY_MAX_SAMPLES = 24

const FALLBACK_ENVIRONMENT_VARIABLES: AdminEnvironmentVariable[] = [
  { key: 'NODE_ENV', value: null, isSecret: false },
  { key: 'API_PORT', value: null, isSecret: false },
  { key: 'AUTH_SESSION_SECRET', value: null, isSecret: true },
  { key: 'DATABASE_URL', value: null, isSecret: true },
  { key: 'SUPABASE_URL', value: null, isSecret: false },
  { key: 'SUPABASE_SECRET_KEY', value: null, isSecret: true },
  { key: 'RESEND_API_KEY', value: null, isSecret: true },
  { key: 'CONTACT_FROM_EMAIL', value: null, isSecret: false },
  { key: 'CONTACT_TO_EMAIL', value: null, isSecret: false },
]

const isAdminEnvironmentVariable = (
  value: unknown
): value is AdminEnvironmentVariable =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'key' in value &&
      typeof value.key === 'string' &&
      'isSecret' in value &&
      typeof value.isSecret === 'boolean' &&
      'value' in value
  )

const normalizeAdminEnvironmentVariables = (
  value: unknown
): AdminEnvironmentVariable[] => {
  if (!Array.isArray(value)) return []

  return value.reduce<AdminEnvironmentVariable[]>((variables, item) => {
    if (!item || typeof item !== 'object') return variables

    const variable = item as Record<string, unknown>
    const key = typeof variable.key === 'string' ? variable.key.trim() : ''
    if (!key) return variables

    const rawValue = variable.value
    const normalizedValue =
      typeof rawValue === 'string'
        ? rawValue
        : rawValue === null || rawValue === undefined
          ? null
          : String(rawValue)

    const secretCandidate =
      typeof variable.isSecret === 'boolean'
        ? variable.isSecret
        : variable.isSecret === 'true'

    variables.push({
      key,
      value: normalizedValue,
      isSecret: secretCandidate,
    })

    return variables
  }, [])
}

const readJsonSafely = async <T,>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

const formatDateTime = (value: string | null) => {
  if (!value) return 'N/A'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
}

const maskEnvironmentValue = (value: string | null) => {
  if (!value) {
    return 'Non impostata'
  }

  const maskLength = Math.max(12, Math.min(value.length, 28))
  return '•'.repeat(maskLength)
}

interface AdminHomeProps {
  forceSkeleton?: boolean
}

function AdminHome({ forceSkeleton = false }: AdminHomeProps) {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>({
    health: null,
    tables: [],
    environmentVariables: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbLatencyTrend, setDbLatencyTrend] = useState<DbLatencySample[]>([])
  const [visibleEnvironmentValues, setVisibleEnvironmentValues] = useState<
    Record<string, boolean>
  >({})

  const appendDbLatencySample = useCallback((sample: DbLatencySample) => {
    setDbLatencyTrend((current) => {
      const next = [...current, sample]
      return next.slice(-DB_LATENCY_MAX_SAMPLES)
    })
  }, [])

  const loadDashboard = useCallback(async () => {
    const [healthResponse, tablesResponse, environmentResponse] = await Promise.all([
      fetch('/api/admin/health', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
      fetch('/api/admin/tables', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
      fetch('/api/admin/environment', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
    ])

    const healthData = await readJsonSafely<
      AdminHealthResponse & { error?: string }
    >(healthResponse)
    const tablesData = await readJsonSafely<AdminTablesResponse>(tablesResponse)
    const environmentData = await readJsonSafely<AdminEnvironmentResponse>(
      environmentResponse
    )

    if (!healthResponse.ok || !healthData) {
      throw new Error(
        healthData?.error || 'Impossibile leggere lo stato operativo'
      )
    }

    if (!tablesResponse.ok || !tablesData) {
      throw new Error(
        tablesData?.error || 'Impossibile leggere il catalogo admin'
      )
    }

    const fromEnvironmentRoute = environmentResponse.ok
      ? normalizeAdminEnvironmentVariables(environmentData?.environmentVariables)
      : []
    const fromHealthRoute = normalizeAdminEnvironmentVariables(
      healthData.environmentVariables
    )

    const resolvedEnvironmentVariables =
      fromEnvironmentRoute.length > 0
        ? fromEnvironmentRoute
        : fromHealthRoute.length > 0
          ? fromHealthRoute
          : FALLBACK_ENVIRONMENT_VARIABLES

    setSnapshot({
      health: healthData,
      tables: Array.isArray(tablesData.tables) ? tablesData.tables : [],
      environmentVariables: resolvedEnvironmentVariables.filter(
        isAdminEnvironmentVariable
      ),
    })
    appendDbLatencySample({
      timestamp: healthData.timestamp,
      latencyMs: healthData.checks.database.latencyMs,
      ok: healthData.checks.database.ok,
    })

    setError(null)
  }, [appendDbLatencySample])

  useEffect(() => {
    if (forceSkeleton) return undefined

    const bootstrap = async () => {
      setLoading(true)
      try {
        await loadDashboard()
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Errore durante il caricamento della dashboard admin'
        )
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
    return undefined
  }, [forceSkeleton, loadDashboard])

  useEffect(() => {
    if (forceSkeleton) return undefined

    let disposed = false
    const pollDbLatency = async () => {
      try {
        const response = await fetch('/api/admin/metrics/db-latency', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) return

        const payload = await readJsonSafely<AdminDbLatencyMetricResponse>(response)
        if (!payload || disposed) return

        appendDbLatencySample({
          timestamp: payload.timestamp,
          latencyMs: payload.database.latencyMs,
          ok: payload.database.ok,
        })
      } catch {
        // Keep silent: admin home has manual refresh and a resilient baseline snapshot.
      }
    }

    const timerId = window.setInterval(() => {
      void pollDbLatency()
    }, DB_LATENCY_POLL_INTERVAL_MS)

    return () => {
      disposed = true
      if (timerId) {
        window.clearInterval(timerId)
      }
    }
  }, [appendDbLatencySample, forceSkeleton])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadDashboard()
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Errore durante l'aggiornamento della dashboard admin"
      )
    } finally {
      setRefreshing(false)
    }
  }

  const handleToggleEnvironmentValue = useCallback((key: string) => {
    setVisibleEnvironmentValues((currentState) => ({
      ...currentState,
      [key]: !currentState[key],
    }))
  }, [])

  const tableSummary = useMemo(() => {
    const groups = new Set(snapshot.tables.map((table) => table.group))
    return {
      totalTables: snapshot.tables.length,
      totalGroups: groups.size,
    }
  }, [snapshot.tables])

  const health = snapshot.health
  const databaseHealthy = Boolean(health?.checks.database.ok)
  const commitSha = health?.deployment.commitSha
  const branch = health?.deployment.branch
  const environmentVariables = snapshot.environmentVariables

  const configuredEnvironmentVariables = useMemo(
    () =>
      environmentVariables.filter(
        (variable) =>
          typeof variable.value === 'string' && variable.value.trim().length > 0
      ),
    [environmentVariables]
  )

  const unconfiguredEnvironmentCount = Math.max(
    0,
    environmentVariables.length - configuredEnvironmentVariables.length
  )

  const visibleEnvironmentCount = useMemo(
    () =>
      configuredEnvironmentVariables.filter(
        (variable) => visibleEnvironmentValues[variable.key]
      ).length,
    [configuredEnvironmentVariables, visibleEnvironmentValues]
  )

  const databaseStatusLabel = loading
    ? 'Loading...'
    : databaseHealthy
      ? 'Operational'
      : 'Unavailable'

  const runtimeUptimeLabel =
    typeof health?.app.uptimeSeconds === 'number'
      ? formatUptime(health.app.uptimeSeconds)
      : 'N/A'

  const checkedAtLabel = formatDateTime(health?.timestamp || null)
  const latencyLabel =
    health?.checks.database.latencyMs === null
      ? 'N/A'
      : `${health?.checks.database.latencyMs} ms`

  return (
    <main className="admin-page admin-page-home">
      <section className="admin-home-shell">
        <AdminHomeHero
          isLoading={loading}
          loading={loading}
          refreshing={refreshing}
          runtimeUptimeLabel={runtimeUptimeLabel}
          checkedAtLabel={checkedAtLabel}
          totalTables={tableSummary.totalTables}
          totalGroups={tableSummary.totalGroups}
          onRefresh={handleRefresh}
        />

        {!loading && error && <p className="admin-error admin-home-error">{error}</p>}

        <AdminHomeDatabaseCard
          isLoading={loading}
          databaseHealthy={databaseHealthy}
          statusLabel={databaseStatusLabel}
          latencyLabel={latencyLabel}
          checkedAtLabel={checkedAtLabel}
          latencyTrend={dbLatencyTrend}
        />

        <AdminHomeInfoCards
          isLoading={loading}
          health={health}
          runtimeUptimeLabel={runtimeUptimeLabel}
          commitSha={commitSha}
          branch={branch}
          userEmail={user?.email || ''}
          loading={loading}
          totalGroups={tableSummary.totalGroups}
          totalTables={tableSummary.totalTables}
        />

        <AdminHomeEnvironmentCard
          isLoading={loading}
          configuredEnvironmentVariables={configuredEnvironmentVariables}
          environmentVariables={environmentVariables}
          visibleEnvironmentValues={visibleEnvironmentValues}
          visibleEnvironmentCount={visibleEnvironmentCount}
          unconfiguredEnvironmentCount={unconfiguredEnvironmentCount}
          onToggleEnvironmentValue={handleToggleEnvironmentValue}
          maskEnvironmentValue={maskEnvironmentValue}
        />
      </section>
    </main>
  )
}

export default AdminHome
