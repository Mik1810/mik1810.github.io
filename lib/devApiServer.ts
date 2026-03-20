import { existsSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { appEnv } from './config/env.js'
import type { ApiHeaders, ApiQuery, ApiResponse } from './types/http.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const apiDir = path.join(rootDir, 'api')
const port = appEnv.apiPort

interface DevApiRequest {
  method?: string
  headers?: ApiHeaders
  query?: ApiQuery
  body?: unknown
  url?: string
  ip?: string
}

const resolveHandlerPath = (pathname: string) => {
  const cleaned = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '')
  const baseCandidate = cleaned || 'index'
  const safeBasePath = path
    .normalize(baseCandidate)
    .replace(/^(\.\.(\/|\\|$))+/, '')
  const candidates = [`${safeBasePath}.ts`, `${safeBasePath}.js`]

  const match = candidates.find((candidate) =>
    existsSync(path.join(apiDir, candidate))
  )

  return path.join(apiDir, match || `${safeBasePath}.js`)
}

const parseBody = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve) => {
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
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    if (!url.pathname.startsWith('/api')) {
      res.statusCode = 404
      return res.end('Not found')
    }

    const handlerPath = resolveHandlerPath(url.pathname)
    if (!existsSync(handlerPath)) {
      res.statusCode = 404
      return res.end('API route not found')
    }

    const handlerUrl = new URL(pathToFileURL(handlerPath).href)
    handlerUrl.searchParams.set('ts', String(Date.now()))

    const mod = (await import(handlerUrl.href)) as {
      default?: (req: DevApiRequest, res: ApiResponse) => Promise<unknown> | unknown
    }
    const handler = mod.default
    if (typeof handler !== 'function') {
      res.statusCode = 500
      return res.end('Invalid API handler')
    }

    const body = await parseBody(req)
    const apiReq: DevApiRequest = {
      method: req.method,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      url: req.url,
      ip: req.socket.remoteAddress,
    }
    const apiRes = createRes(res)

    await handler(apiReq, apiRes)
  } catch (error) {
    console.error('[dev-api] error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

server.listen(port, () => {
  console.log(`[dev-api] listening on http://localhost:${port}`)
})
