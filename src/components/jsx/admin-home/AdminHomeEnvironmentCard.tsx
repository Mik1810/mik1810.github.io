import type { AdminEnvironmentVariable } from '../../../types/app.js'

import { EnvVariableIcon, EyeIcon, EyeOffIcon, RuntimeIcon } from './AdminHomeIcons'

interface AdminHomeEnvironmentCardProps {
  configuredEnvironmentVariables: AdminEnvironmentVariable[]
  environmentVariables: AdminEnvironmentVariable[]
  visibleEnvironmentValues: Record<string, boolean>
  visibleEnvironmentCount: number
  unconfiguredEnvironmentCount: number
  onToggleEnvironmentValue: (key: string) => void
  maskEnvironmentValue: (value: string | null) => string
}

function AdminHomeEnvironmentCard({
  configuredEnvironmentVariables,
  environmentVariables,
  visibleEnvironmentValues,
  visibleEnvironmentCount,
  unconfiguredEnvironmentCount,
  onToggleEnvironmentValue,
  maskEnvironmentValue,
}: AdminHomeEnvironmentCardProps) {
  const hasEnvironmentVariables = configuredEnvironmentVariables.length > 0

  return (
    <section className="admin-card admin-home-card admin-home-env-card">
      <div className="admin-home-card-header admin-home-card-header-wrap">
        <div className="admin-home-card-title">
          <span className="admin-home-icon-badge is-neutral">
            <RuntimeIcon className="admin-home-icon" />
          </span>
          <div>
            <p className="admin-home-card-eyebrow">Protected values</p>
            <h3>Environment Variables</h3>
          </div>
        </div>
        <span className="admin-home-inline-note">
          {configuredEnvironmentVariables.length} configurate /{' '}
          {environmentVariables.length} tracciate
        </span>
      </div>

      <p className="admin-home-card-copy">
        Mostriamo solo le variabili attualmente valorizzate. I valori restano
        nascosti con pallini finche non premi l'icona occhio.
      </p>

      {hasEnvironmentVariables ? (
        <div className="admin-home-env-list">
          {configuredEnvironmentVariables.map((variable) => {
            const value = typeof variable.value === 'string' ? variable.value : ''
            const isVisible = Boolean(visibleEnvironmentValues[variable.key])
            const displayValue = isVisible ? value : maskEnvironmentValue(value)

            return (
              <article key={variable.key} className="admin-home-env-row">
                <div className="admin-home-env-row-main">
                  <span className="admin-home-env-row-icon" aria-hidden="true">
                    <EnvVariableIcon className="admin-home-env-row-icon-svg" />
                  </span>
                  <div className="admin-home-env-row-meta">
                    <code className="admin-home-env-key">{variable.key}</code>
                    <span
                      className={`admin-home-env-kind ${
                        variable.isSecret ? 'is-secret' : 'is-public'
                      }`.trim()}
                    >
                      {variable.isSecret ? 'Secret' : 'Public'}
                    </span>
                  </div>
                </div>

                <div className="admin-home-env-row-value-wrap">
                  <button
                    type="button"
                    className="admin-home-env-toggle admin-home-env-toggle-inline"
                    onClick={() => onToggleEnvironmentValue(variable.key)}
                    aria-label={
                      isVisible
                        ? `Nascondi il valore di ${variable.key}`
                        : `Mostra il valore di ${variable.key}`
                    }
                    title={isVisible ? 'Nascondi valore' : 'Mostra valore'}
                  >
                    {isVisible ? (
                      <EyeOffIcon className="admin-home-env-toggle-icon" />
                    ) : (
                      <EyeIcon className="admin-home-env-toggle-icon" />
                    )}
                  </button>
                  <code
                    className={`admin-home-env-inline-value ${
                      isVisible ? 'is-visible' : ''
                    }`.trim()}
                  >
                    {displayValue}
                  </code>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="admin-home-empty-state">
          Nessuna variabile risulta configurata in questo ambiente.
        </div>
      )}

      <p className="admin-small-text admin-home-env-footnote">
        {visibleEnvironmentCount} visibili su {configuredEnvironmentVariables.length}
        {unconfiguredEnvironmentCount > 0
          ? ` · ${unconfiguredEnvironmentCount} non impostate nascoste`
          : ''}
        .
      </p>
    </section>
  )
}

export default AdminHomeEnvironmentCard
