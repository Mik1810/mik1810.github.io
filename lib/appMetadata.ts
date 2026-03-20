import { readFileSync } from 'node:fs'

const packageJsonPath = new URL('../package.json', import.meta.url)
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  name?: string
  version?: string
}

const processStartedAt = new Date(
  Date.now() -
    (typeof process.uptime === 'function' ? process.uptime() * 1000 : 0)
)

export const appMetadata = Object.freeze({
  name: packageJson.name || 'app',
  version: packageJson.version || '0.0.0',
  startedAt: processStartedAt,
})

export const getDeploymentMetadata = () => ({
  commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null,
  branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || null,
})

export const getUptimeSeconds = () =>
  Math.max(
    0,
    Math.floor(
      typeof process.uptime === 'function'
        ? process.uptime()
        : (Date.now() - processStartedAt.getTime()) / 1000
    )
  )
