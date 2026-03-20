import type { AdminHealthResponse } from '../../../types/app.js'

import { ReleaseIcon, RuntimeIcon, WorkspaceIcon } from './AdminHomeIcons'

interface AdminHomeInfoCardsProps {
  isLoading?: boolean
  health: AdminHealthResponse | null
  runtimeUptimeLabel: string
  commitSha?: string | null
  branch?: string | null
  userEmail: string
  loading: boolean
  totalGroups: number
  totalTables: number
}

function AdminHomeInfoCards({
  isLoading = false,
  health,
  runtimeUptimeLabel,
  commitSha,
  branch,
  userEmail,
  loading,
  totalGroups,
  totalTables,
}: AdminHomeInfoCardsProps) {
  if (isLoading) {
    return (
      <section className="admin-home-grid-trio">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={`admin-home-info-card-skeleton-${index}`} className="admin-card admin-home-card">
            <div className="admin-home-card-header">
              <div className="admin-home-card-title">
                <span className="admin-skeleton admin-home-skeleton-icon" />
                <div className="admin-home-skeleton-stack">
                  <span className="admin-skeleton admin-home-skeleton-eyebrow" />
                  <span className="admin-skeleton admin-home-skeleton-card-title" />
                </div>
              </div>
            </div>
            <div className="admin-home-metrics">
              {Array.from({ length: 3 }).map((__, metricIndex) => (
                <div key={`admin-home-info-metric-skeleton-${index}-${metricIndex}`}>
                  <span className="admin-skeleton admin-home-skeleton-metric-label" />
                  <span className="admin-skeleton admin-home-skeleton-metric-value" />
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    )
  }

  return (
    <section className="admin-home-grid-trio">
      <article className="admin-card admin-home-card">
        <div className="admin-home-card-header">
          <div className="admin-home-card-title">
            <span className="admin-home-icon-badge is-info">
              <RuntimeIcon className="admin-home-icon" />
            </span>
            <div>
              <p className="admin-home-card-eyebrow">Process snapshot</p>
              <h3>Runtime</h3>
            </div>
          </div>
        </div>
        <dl className="admin-home-metrics">
          <div>
            <dt>Environment</dt>
            <dd>{health?.environment || 'N/A'}</dd>
          </div>
          <div>
            <dt>Uptime</dt>
            <dd>{runtimeUptimeLabel}</dd>
          </div>
          <div>
            <dt>Started at</dt>
            <dd>{health?.app.startedAt || 'N/A'}</dd>
          </div>
        </dl>
      </article>

      <article className="admin-card admin-home-card">
        <div className="admin-home-card-header">
          <div className="admin-home-card-title">
            <span className="admin-home-icon-badge is-warning">
              <ReleaseIcon className="admin-home-icon" />
            </span>
            <div>
              <p className="admin-home-card-eyebrow">Build metadata</p>
              <h3>Release</h3>
            </div>
          </div>
        </div>
        <dl className="admin-home-metrics">
          <div>
            <dt>App</dt>
            <dd>
              {health?.app.name || 'N/A'} {health ? `v${health.app.version}` : ''}
            </dd>
          </div>
          <div>
            <dt>Commit</dt>
            <dd>{commitSha ? commitSha.slice(0, 7) : 'Local / not exposed'}</dd>
          </div>
          <div>
            <dt>Branch</dt>
            <dd>{branch || 'Local / not exposed'}</dd>
          </div>
        </dl>
      </article>

      <article className="admin-card admin-home-card">
        <div className="admin-home-card-header">
          <div className="admin-home-card-title">
            <span className="admin-home-icon-badge is-neutral">
              <WorkspaceIcon className="admin-home-icon" />
            </span>
            <div>
              <p className="admin-home-card-eyebrow">Admin access</p>
              <h3>Workspace</h3>
            </div>
          </div>
        </div>
        <dl className="admin-home-metrics">
          <div>
            <dt>Signed in as</dt>
            <dd>{userEmail || 'N/A'}</dd>
          </div>
          <div>
            <dt>Groups</dt>
            <dd>{loading ? '...' : totalGroups}</dd>
          </div>
          <div>
            <dt>Tables</dt>
            <dd>{loading ? '...' : totalTables}</dd>
          </div>
        </dl>
      </article>
    </section>
  )
}

export default AdminHomeInfoCards
