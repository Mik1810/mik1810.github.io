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
        checks: expect.objectContaining({
          database: expect.objectContaining({
            ok: true,
          }),
        }),
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
        checks: expect.objectContaining({
          database: expect.objectContaining({
            ok: false,
            latencyMs: null,
          }),
        }),
      })
    )
  })
})
