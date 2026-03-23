import { DatabaseIcon } from './AdminHomeIcons'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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
  trendViewMode: 'window' | 'session'
  onTrendViewModeChange: (mode: 'window' | 'session') => void
  latencyTrend: Array<{
    timestamp: string
    latencyMs: number | null
    ok: boolean
  }>
}

interface LatencyTrendPoint {
  label: string
  timestampMs: number
  latencyMs: number | null
  timestamp: string
  overThreshold: boolean
}

interface OverThresholdSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

const LATENCY_ALERT_THRESHOLD_MS = 1000

const formatTrendLabel = (value: string | number) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed)
}

const formatTooltipDateTime = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(parsed)
}

function AdminHomeDatabaseCard({
  isLoading = false,
  databaseHealthy,
  statusLabel,
  latencyLabel,
  checkedAtLabel,
  trendViewMode,
  onTrendViewModeChange,
  latencyTrend,
}: AdminHomeDatabaseCardProps) {
  const trendData: LatencyTrendPoint[] = latencyTrend.map((sample, index) => {
    const timestampMs = new Date(sample.timestamp).getTime()
    const latencyValue = sample.latencyMs
    const overThreshold =
      typeof latencyValue === 'number' && latencyValue > LATENCY_ALERT_THRESHOLD_MS

    return {
      label: formatTrendLabel(sample.timestamp),
      timestampMs: Number.isNaN(timestampMs) ? index : timestampMs,
      latencyMs: latencyValue,
      timestamp: sample.timestamp,
      overThreshold,
    }
  })
  const overThresholdSegments = trendData.reduce<OverThresholdSegment[]>(
    (segments, point, index, points) => {
      if (index === 0) return segments
      const prev = points[index - 1]
      if (!prev) return segments

      const prevY = prev.latencyMs
      const currY = point.latencyMs

      if (typeof prevY !== 'number' || typeof currY !== 'number') return segments

      const prevAbove = prevY > LATENCY_ALERT_THRESHOLD_MS
      const currAbove = currY > LATENCY_ALERT_THRESHOLD_MS

      if (!prevAbove && !currAbove) return segments

      const x1 = prev.timestampMs
      const x2 = point.timestampMs
      const y1 = prevY
      const y2 = currY

      if (prevAbove && currAbove) {
        segments.push({ x1, y1, x2, y2 })
        return segments
      }

      if (y2 === y1) return segments

      const t = (LATENCY_ALERT_THRESHOLD_MS - y1) / (y2 - y1)
      const xIntersection = x1 + t * (x2 - x1)

      if (prevAbove && !currAbove) {
        segments.push({
          x1,
          y1,
          x2: xIntersection,
          y2: LATENCY_ALERT_THRESHOLD_MS,
        })
      } else if (!prevAbove && currAbove) {
        segments.push({
          x1: xIntersection,
          y1: LATENCY_ALERT_THRESHOLD_MS,
          x2,
          y2,
        })
      }

      return segments
    },
    []
  )
  const overThresholdCount = trendData.reduce(
    (total, point) => (point.overThreshold ? total + 1 : total),
    0
  )
  const validLatencyValues = trendData
    .map((point) => point.latencyMs)
    .filter((value): value is number => typeof value === 'number')
  const averageLatencyValue =
    validLatencyValues.length > 0
      ? Math.round(
          validLatencyValues.reduce((total, value) => total + value, 0) /
            validLatencyValues.length
        )
      : null
  const averageLatencyLabel =
    averageLatencyValue === null ? 'N/A' : `${averageLatencyValue} ms`

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
          <span>Latest latency</span>
          <strong>{latencyLabel}</strong>
        </div>
        <div className="admin-home-stat-tile">
          <span>Average latency</span>
          <strong>{averageLatencyLabel}</strong>
        </div>
        <div className="admin-home-stat-tile">
          <span>Checked at</span>
          <strong>{checkedAtLabel}</strong>
        </div>
      </div>

      <div className="admin-home-latency-trend-wrap">
        <div className="admin-home-latency-trend-head">
          <p className="admin-home-card-eyebrow">Latency trend</p>
          <div className="admin-home-latency-meta">
            <span className="admin-home-latency-count">Samples: {latencyTrend.length}</span>
            <span className="admin-home-latency-alert-count">
              Over threshold: {overThresholdCount}
            </span>
          </div>
        </div>
        <div className="admin-home-segmented-control" role="group" aria-label="Periodo grafico latenza">
          <button
            type="button"
            className={`admin-home-segmented-control-button ${
              trendViewMode === 'window' ? 'is-active' : ''
            }`.trim()}
            onClick={() => onTrendViewModeChange('window')}
          >
            Ultimi 30
          </button>
          <button
            type="button"
            className={`admin-home-segmented-control-button ${
              trendViewMode === 'session' ? 'is-active' : ''
            }`.trim()}
            onClick={() => onTrendViewModeChange('session')}
          >
            Sessione
          </button>
        </div>
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
                  type="number"
                  dataKey="timestampMs"
                  domain={['dataMin', 'dataMax']}
                  tickCount={8}
                  tickFormatter={(value) => formatTrendLabel(value)}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                  tickLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                />
                <YAxis
                  tickFormatter={(value) => `${value}ms`}
                  width={72}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                  tickLine={{ stroke: 'rgba(148, 163, 184, 0.26)' }}
                />
                <ReferenceLine
                  y={LATENCY_ALERT_THRESHOLD_MS}
                  stroke="rgba(248, 113, 113, 0.9)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{
                    value: 'Soglia 1000ms',
                    position: 'right',
                    fill: '#fca5a5',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const item = payload[0]?.payload as LatencyTrendPoint | undefined
                    if (!item) return null
                    const latencyLabel =
                      item.latencyMs === null || item.latencyMs === undefined
                        ? 'N/A'
                        : `${item.latencyMs} ms`

                    return (
                      <div
                        style={{
                          background: 'rgba(15, 23, 42, 0.92)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '10px',
                          color: '#e2e8f0',
                          padding: '0.6rem 0.75rem',
                        }}
                      >
                        <p style={{ margin: 0, color: '#cbd5e1' }}>
                          {formatTooltipDateTime(item.timestamp)}
                        </p>
                        <p style={{ margin: '0.25rem 0 0', color: '#38bdf8', fontWeight: 700 }}>
                          latencyMs : {latencyLabel}
                        </p>
                      </div>
                    )
                  }}
                  cursor={{ stroke: 'rgba(56, 189, 248, 0.45)', strokeWidth: 1 }}
                  isAnimationActive={false}
                />
                <Area
                  type="linear"
                  dataKey="latencyMs"
                  connectNulls={false}
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fill="url(#admin-latency-fill)"
                  dot={false}
                  isAnimationActive={false}
                  activeDot={(dotProps) => {
                    const payload = dotProps?.payload as LatencyTrendPoint | undefined
                    const isOverThreshold = Boolean(payload?.overThreshold)
                    return (
                      <circle
                        cx={dotProps.cx}
                        cy={dotProps.cy}
                        r={4.5}
                        stroke={isOverThreshold ? '#ef4444' : '#7dd3fc'}
                        strokeWidth={2}
                        fill={isOverThreshold ? '#7f1d1d' : '#0f172a'}
                      />
                    )
                  }}
                />
                {overThresholdSegments.map((segment, index) => (
                  <ReferenceLine
                    key={`over-threshold-segment-${index}`}
                    segment={[
                      { x: segment.x1, y: segment.y1 },
                      { x: segment.x2, y: segment.y2 },
                    ]}
                    stroke="#ef4444"
                    strokeWidth={2.8}
                  />
                ))}
                {overThresholdCount > 0 && (
                  <Area
                    type="linear"
                    dataKey="latencyMs"
                    connectNulls={false}
                    stroke="transparent"
                    fill="transparent"
                    isAnimationActive={false}
                    activeDot={false}
                    dot={(dotProps) => {
                      const payload = dotProps?.payload as LatencyTrendPoint | undefined
                      if (!payload?.overThreshold) return <></>
                      return (
                        <circle
                          cx={dotProps.cx}
                          cy={dotProps.cy}
                          r={4}
                          fill="#ef4444"
                          stroke="#fecaca"
                          strokeWidth={1.5}
                        />
                      )
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </article>
  )
}

export default AdminHomeDatabaseCard
