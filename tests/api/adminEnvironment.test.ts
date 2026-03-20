import { describe, expect, it } from 'vitest'

import adminHandler from '../../api/admin.ts'
import {
  createSessionCookie,
  createSessionToken,
} from '../../lib/authSession.ts'
import { invokeApiHandler } from './testUtils.ts'

const createAdminCookieHeader = () =>
  createSessionCookie(
    createSessionToken({
      id: 'admin_environment_test',
      email: 'admin@example.com',
    })
  )

describe('Admin environment endpoint', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await invokeApiHandler(adminHandler, {
      url: '/api/admin/environment',
      ip: '127.0.7.10',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      error: 'Unauthorized',
      code: 'unauthorized',
    })
  })

  it('returns tracked environment variables for authenticated requests', async () => {
    const response = await invokeApiHandler(adminHandler, {
      url: '/api/admin/environment',
      ip: '127.0.7.11',
      headers: {
        host: 'localhost',
        cookie: createAdminCookieHeader(),
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.getHeader('cache-control')).toBe('no-store')
    expect(response.body).toEqual(
      expect.objectContaining({
        environmentVariables: expect.any(Array),
      })
    )

    const keys = (
      response.body as {
        environmentVariables: Array<{ key: string; value: string | null }>
      }
    ).environmentVariables.map((item) => item.key)

    expect(keys).toEqual(
      expect.arrayContaining([
        'NODE_ENV',
        'API_PORT',
        'AUTH_SESSION_SECRET',
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_SECRET_KEY',
        'RESEND_API_KEY',
        'CONTACT_FROM_EMAIL',
        'CONTACT_TO_EMAIL',
      ])
    )
    expect(keys).not.toContain('SUPABASE_DB_URL')
    expect(keys).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
  })
})
