import { DatabaseIcon } from './AdminHomeIcons'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface AdminHomeDatabaseCardProps {
  isLoading?: boolean
  databaseHealthy: boolean
  statusLabel: string
  latencyLabel: string
  checkedAtLabel: string
  latencyTrend: Array<{
    timestamp: string
    latencyMs: number | null
    ok: boolean
  }>
}

interface LatencyTrendPoint {
  label: string
  latencyMs: number | null
  timestamp: string
}

const formatTrendLabel = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function AdminHomeDatabaseCard({
  isLoading = false,
  databaseHealthy,
  statusLabel,
  latencyLabel,
  checkedAtLabel,
  latencyTrend,
}: AdminHomeDatabaseCardProps) {
  const trendData: LatencyTrendPoint[] = latencyTrend.map((sample) => ({
    label: formatTrendLabel(sample.timestamp),
    latencyMs: sample.latencyMs,
    timestamp: sample.timestamp,
  }))

  if (isLoading) {
    return (
      <article className="admin-card admin-home-card admin-home-card-database">
        <div className="admin-home-card-header">
          <div className="admin-home-card-title">
            <span className="admin-skeleton admin-home-skeleton-icon" />
            <div className="admin-home-skeleton-stack">
              <span className="admin-skeleton admin-home-skeleton-eyebrow" />
              <span className="admin-skeleton admin-home-skeleton-card-title" />
            </div>
          </div>
          <span className="admin-skeleton admin-home-skeleton-pill" />
        </div>
        <div className="admin-home-stat-grid admin-home-stat-grid-database">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={`admin-home-database-metric-skeleton-${index}`} className="admin-home-stat-tile">
              <span className="admin-skeleton admin-home-skeleton-metric-label" />
              <span className="admin-skeleton admin-home-skeleton-metric-value" />
            </div>
          ))}
        </div>
        <div className="admin-home-latency-trend admin-home-latency-trend-skeleton">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={`admin-home-latency-trend-skeleton-${index}`}
              className="admin-skeleton admin-home-latency-bar-skeleton"
            />
          ))}
        </div>
      </article>
    )
  }

  return (
    <article className="admin-card admin-home-card admin-home-card-database">
      <div className="admin-home-card-header">
        <div className="admin-home-card-title">
          <span className="admin-home-icon-badge is-success">
            <DatabaseIcon className="admin-home-icon" />
          </span>
          <div>
            <p className="admin-home-card-eyebrow">Data plane</p>
            <h3>Database</h3>
          </div>
        </div>
        <div
          className={`admin-home-status-inline ${
            databaseHealthy ? 'is-healthy' : 'is-unhealthy'
          }`.trim()}
        >
          <span
            className={`admin-home-dot ${
              databaseHealthy ? 'is-healthy' : 'is-unhealthy'
            }`.trim()}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </div>
      </div>

      <p className="admin-home-card-copy">
        Stato connessione applicativa e latenza dell'ultimo controllo.
      </p>

      <div className="admin-home-stat-grid admin-home-stat-grid-database">
        <div className="admin-home-stat-tile">
          <span>Latency</span>
          <strong>{latencyLabel}</strong>
        </div>
        <div className="admin-home-stat-tile">
          <span>Checked at</span>
          <strong>{checkedAtLabel}</strong>
        </div>
      </div>

      <div className="admin-home-latency-trend-wrap">
        <p className="admin-home-card-eyebrow">Latency trend</p>
        {latencyTrend.length === 0 ? (
          <p className="admin-home-inline-note">In attesa dei primi campioni…</p>
        ) : (
          <div className="admin-home-latency-chart" role="img" aria-label="Trend latenza database">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={trendData}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="admin-latency-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.36} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis
                  dataKey="label"
                  minTickGap={18}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                  tickLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                />
                <YAxis
                  tickFormatter={(value) => `${value} ms`}
                  width={62}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                  tickLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                />
                <Tooltip
                  formatter={(value) =>
                    value === null || value === undefined ? 'N/A' : `${value} ms`
                  }
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as LatencyTrendPoint | undefined
                    return item?.timestamp || ''
                  }}
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.92)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '10px',
                    color: '#e2e8f0',
                  }}
                  cursor={{ stroke: 'rgba(56, 189, 248, 0.45)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="latencyMs"
                  connectNulls={false}
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fill="url(#admin-latency-fill)"
                  dot={{ r: 3.5, stroke: '#38bdf8', strokeWidth: 2, fill: '#0f172a' }}
                  activeDot={{ r: 5.5, stroke: '#7dd3fc', strokeWidth: 2, fill: '#0f172a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </article>
  )
}

export default AdminHomeDatabaseCard
