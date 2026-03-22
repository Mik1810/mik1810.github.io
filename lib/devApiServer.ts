import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import adminHandler from '../api/admin.ts'
import homeHandler from '../api/home.ts'
import { appEnv } from './config/env.js'
import type { ApiHeaders, ApiQuery, ApiResponse } from './types/http.js'

const port = appEnv.apiPort
let requestCounter = 0
const publicRouteSet = new Set([
  'about',
  'profile',
  'projects',
  'skills',
  'experiences',
  'health',
  'contact',
])

interface DevApiRequest {
  method?: string
  headers?: ApiHeaders
  query?: ApiQuery
  body?: unknown
  url?: string
  ip?: string
  signal?: AbortSignal
}

const resolveHandler = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 2 || parts[0] !== 'api') return null
  if (parts[1] === 'admin') return adminHandler
  if (parts[1] === 'home' || publicRouteSet.has(parts[1] || '')) return homeHandler
  return null
}

const parseBody = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve(undefined)
      return
    }

    let data = ''
    req.on('data', (chunk) => {
      data += String(chunk)
    })
    req.on('end', () => {
      if (!data) return resolve(undefined)
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve(data)
      }
    })
  })

const createRes = (res: ServerResponse): ApiResponse => {
  const apiRes = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code
      return this
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      res.setHeader(name, value)
      return this
    },
    json(payload: unknown) {
      res.statusCode = this.statusCode
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(payload))
      return this
    },
    send(payload: unknown) {
      res.statusCode = this.statusCode
      res.end(String(payload))
      return this
    },
  }

  return apiRes
}

const server = createServer(async (req, res) => {
  const requestId = ++requestCounter
  const requestStartedAt = Date.now()
  let completed = false
  const requestAbortController = new AbortController()

  if (appEnv.nodeEnv !== 'production') {
    console.info('[timing] dev-api.request.start', {
      requestId,
      url: req.url,
      method: req.method,
    })
  }

  res.on('finish', () => {
    completed = true
    if (appEnv.nodeEnv !== 'production') {
      console.info('[timing] dev-api.response.finish', {
        requestId,
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
        durationMs: Date.now() - requestStartedAt,
      })
    }
  })

  res.on('close', () => {
    requestAbortController.abort()
    if (appEnv.nodeEnv !== 'production') {
      console.info('[timing] dev-api.response.close', {
        requestId,
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
        durationMs: Date.now() - requestStartedAt,
        finished: completed,
      })
    }
  })
  req.on('close', () => {
    requestAbortController.abort()
  })

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    if (!url.pathname.startsWith('/api')) {
      res.statusCode = 404
      return res.end('Not found')
    }

    const handler = resolveHandler(url.pathname)
    if (!handler) {
      res.statusCode = 404
      return res.end('API route not found')
    }

    if (appEnv.nodeEnv !== 'production') {
      console.info('[timing] dev-api.parseBody.start', {
        requestId,
        url: req.url,
      })
    }
    const body = await parseBody(req)
    if (appEnv.nodeEnv !== 'production') {
      console.info('[timing] dev-api.parseBody.end', {
        requestId,
        url: req.url,
        durationMs: Date.now() - requestStartedAt,
      })
    }
    if (requestAbortController.signal.aborted) return

    const apiReq: DevApiRequest = {
      method: req.method,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      url: req.url,
      ip: req.socket.remoteAddress,
      signal: requestAbortController.signal,
    }
    const apiRes = createRes(res)

    await handler(apiReq, apiRes)
    if (appEnv.nodeEnv !== 'production') {
      console.info('[timing] dev-api.handler.end', {
        requestId,
        url: req.url,
        method: req.method,
        durationMs: Date.now() - requestStartedAt,
        aborted: requestAbortController.signal.aborted,
      })
    }
  } catch (error) {
    console.error('[dev-api] error:', error)
    if (appEnv.nodeEnv !== 'production') {
      console.info('[timing] dev-api.handler.error', {
        requestId,
        url: req.url,
        method: req.method,
        durationMs: Date.now() - requestStartedAt,
      })
    }
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

server.listen(port, () => {
  console.log(`[dev-api] listening on http://localhost:${port}`)
  if (appEnv.nodeEnv === 'production') return
  if (!appEnv.devApiWarmup) {
    console.info('[timing] dev-api.ready', {
      message:
        'Dev API pronta senza warmup (imposta DEV_API_WARMUP=true per abilitarlo).',
    })
    return
  }

  const warmupEndpoints = [
    '/api/about?lang=it',
    '/api/projects?lang=it',
    '/api/profile?lang=it',
    '/api/experiences?lang=it',
    '/api/skills?lang=it',
  ]

  void (async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
    console.info('[timing] dev-api.warmup.start', {
      endpoints: warmupEndpoints.length,
    })

    for (const endpoint of warmupEndpoints) {
      const startedAt = Date.now()
      const warmupController = new AbortController()
      const timeoutId = setTimeout(() => warmupController.abort(), 10000)
      try {
        const response = await fetch(`http://localhost:${port}${endpoint}`, {
          method: 'GET',
          cache: 'no-store',
          signal: warmupController.signal,
        })
        console.info('[timing] dev-api.warmup.end', {
          endpoint,
          status: response.status,
          durationMs: Date.now() - startedAt,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.info('[timing] dev-api.warmup.error', {
          endpoint,
          durationMs: Date.now() - startedAt,
          message,
        })
      } finally {
        clearTimeout(timeoutId)
      }
    }

    console.info('[timing] dev-api.warmup.ready', {
      message: 'Warmup completato: puoi aprire /home',
    })
  })()
})
