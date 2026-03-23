import { spawn } from 'node:child_process'

const parentStartedAtMs = Date.now()
const parentStartedAt = new Date(parentStartedAtMs).toISOString()
const tsxBin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx'

console.log('[dev-api] launcher.start', {
  startedAt: parentStartedAt,
})

const child = spawn(tsxBin, ['watch', 'lib/devApiServer.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DEV_API_PARENT_START_MS: String(parentStartedAtMs),
  },
})

const forwardSignal = (signal: NodeJS.Signals) => {
  if (!child.killed) {
    child.kill(signal)
  }
}

process.on('SIGINT', () => forwardSignal('SIGINT'))
process.on('SIGTERM', () => forwardSignal('SIGTERM'))

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
