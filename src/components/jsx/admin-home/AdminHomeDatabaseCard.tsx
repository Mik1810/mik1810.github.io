import { DatabaseIcon } from './AdminHomeIcons'

interface AdminHomeDatabaseCardProps {
  isLoading?: boolean
  databaseHealthy: boolean
  statusLabel: string
  latencyLabel: string
  checkedAtLabel: string
}

function AdminHomeDatabaseCard({
  isLoading = false,
  databaseHealthy,
  statusLabel,
  latencyLabel,
  checkedAtLabel,
}: AdminHomeDatabaseCardProps) {
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
    </article>
  )
}

export default AdminHomeDatabaseCard
