import { execSync } from 'node:child_process'
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

const readGitMetadata = (command: string) => {
  try {
    const value = execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return value.length > 0 ? value : null
  } catch {
    return null
  }
}

const localGitMetadata = Object.freeze({
  commitSha: readGitMetadata('git rev-parse HEAD'),
  branch:
    readGitMetadata('git branch --show-current') ||
    readGitMetadata('git rev-parse --abbrev-ref HEAD'),
})

export const getDeploymentMetadata = () => ({
  commitSha:
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    localGitMetadata.commitSha,
  branch:
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GITHUB_REF_NAME ||
    localGitMetadata.branch,
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
