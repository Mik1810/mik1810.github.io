import { afterEach, describe, expect, it, vi } from 'vitest'

const mockSqlClient = vi.hoisted(() => vi.fn())

vi.mock('../../lib/db/client.ts', async () => {
  const actual = await vi.importActual<typeof import('../../lib/db/client.ts')>(
    '../../lib/db/client.ts'
  )

  return {
    ...actual,
    sqlClient: mockSqlClient,
  }
})

import healthHandler from '../../api/health.ts'
import adminHealthHandler from '../../api/admin/health.ts'
import {
  createSessionCookie,
  createSessionToken,
} from '../../lib/authSession.ts'
import { invokeApiHandler } from './testUtils.ts'

afterEach(() => {
  vi.restoreAllMocks()
  mockSqlClient.mockReset()
})

describe('Health endpoint', () => {
  it('returns 200 with a healthy database check', async () => {
    mockSqlClient.mockResolvedValueOnce([{ ok: 1 }])

    const response = await invokeApiHandler(healthHandler, {
      url: '/api/health',
      ip: '127.0.6.10',
    })

    expect(response.statusCode).toBe(200)
    expect(response.getHeader('cache-control')).toBe('no-store')
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        service: 'api',
        app: expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String),
        }),
        checks: expect.objectContaining({
          database: expect.objectContaining({
            ok: true,
          }),
        }),
      })
    )
    expect(response.body).not.toEqual(
      expect.objectContaining({
        environment: expect.anything(),
        deployment: expect.anything(),
      })
    )
  })

  it('returns 503 when the database check fails', async () => {
    mockSqlClient.mockRejectedValueOnce(new Error('DB down'))

    const response = await invokeApiHandler(healthHandler, {
      url: '/api/health',
      ip: '127.0.6.11',
    })

    expect(response.statusCode).toBe(503)
    expect(response.getHeader('cache-control')).toBe('no-store')
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: false,
        app: expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String),
        }),
        checks: expect.objectContaining({
          database: expect.objectContaining({
            ok: false,
            latencyMs: null,
          }),
        }),
      })
    )
  })

  it('returns a richer admin-only health payload for authenticated requests', async () => {
    mockSqlClient.mockResolvedValueOnce([{ ok: 1 }])

    const response = await invokeApiHandler(adminHealthHandler, {
      url: '/api/admin/health',
      ip: '127.0.6.12',
      headers: {
        host: 'localhost',
        cookie: createSessionCookie(
          createSessionToken({
            id: 'admin_health_test',
            email: 'admin@example.com',
          })
        ),
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.getHeader('cache-control')).toBe('no-store')
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        service: 'api',
        environment: expect.any(String),
        deployment: expect.objectContaining({}),
        app: expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String),
          uptimeSeconds: expect.any(Number),
          startedAt: expect.any(String),
        }),
        checks: expect.objectContaining({
          database: expect.objectContaining({
            ok: true,
          }),
        }),
      })
    )
    const deployment = (response.body as { deployment: { commitSha: unknown; branch: unknown } })
      .deployment
    expect(
      deployment.commitSha === null || typeof deployment.commitSha === 'string'
    ).toBe(true)
    expect(deployment.branch === null || typeof deployment.branch === 'string').toBe(
      true
    )
  })

  it('rejects unauthenticated access to the admin health payload', async () => {
    const response = await invokeApiHandler(adminHealthHandler, {
      url: '/api/admin/health',
      ip: '127.0.6.13',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      error: 'Unauthorized',
      code: 'unauthorized',
    })
  })
})
