import { spawn } from 'node:child_process'

const parentStartedAtMs = Date.now()
const tsxBin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx'

const pad2 = (value: number) => String(value).padStart(2, '0')
const formatLogDateTime = (ms: number) => {
  const date = new Date(ms)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} ${pad2(date.getDate())}:${pad2(date.getMonth() + 1)}:${date.getFullYear()}`
}

console.log('[dev-api] launcher.start', {
  startedAt: formatLogDateTime(parentStartedAtMs),
})

const child = spawn(tsxBin, ['watch', 'lib/devApiServer.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DEV_API_PARENT_START_MS: String(parentStartedAtMs),
    DEV_API_STARTUP_TIMING: 'true',
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
