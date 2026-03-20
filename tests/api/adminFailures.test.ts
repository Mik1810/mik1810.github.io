import { afterEach, describe, expect, it, vi } from 'vitest'

const mockLoginAdmin = vi.hoisted(() => vi.fn())

vi.mock('../../lib/services/adminAuthService.ts', async () => {
  const actual = await vi.importActual<
    typeof import('../../lib/services/adminAuthService.ts')
  >('../../lib/services/adminAuthService.ts')

  return {
    ...actual,
    loginAdmin: mockLoginAdmin,
  }
})

import adminLoginHandler from '../../api/admin/login.ts'
import adminLogoutHandler from '../../api/admin/logout.ts'
import adminSessionHandler from '../../api/admin/session.ts'
import adminTableHandler from '../../api/admin/table.ts'
import adminTablesHandler from '../../api/admin/tables.ts'
import {
  createSessionCookie,
  createSessionToken,
} from '../../lib/authSession.ts'
import { invokeApiHandler } from './testUtils.ts'

const adminCookie = createSessionCookie(
  createSessionToken({
    id: 'admin_failure_test',
    email: 'admin@example.com',
  })
)

afterEach(() => {
  vi.restoreAllMocks()
  mockLoginAdmin.mockReset()
})

describe('Admin failure paths', () => {
  it('reports unauthenticated admin session when the cookie is invalid', async () => {
    const response = await invokeApiHandler(adminSessionHandler, {
      url: '/api/admin/session',
      ip: '127.0.5.10',
      headers: {
        host: 'localhost',
        cookie: 'admin_session=invalid.token',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      authenticated: false,
      user: null,
    })
  })

  it('maps login failures to auth_failed responses', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLoginAdmin.mockRejectedValueOnce(new Error('Invalid credentials'))

    const response = await invokeApiHandler(adminLoginHandler, {
      method: 'POST',
      url: '/api/admin/login',
      ip: '127.0.5.11',
      body: {
        email: 'admin@example.com',
        password: 'wrong-password',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      error: 'Invalid credentials',
      code: 'auth_failed',
    })
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects logout without an authenticated session', async () => {
    const response = await invokeApiHandler(adminLogoutHandler, {
      method: 'POST',
      url: '/api/admin/logout',
      ip: '127.0.5.12',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      error: 'Unauthorized',
      code: 'unauthorized',
    })
  })

  it('rejects tables listing without an authenticated session', async () => {
    const response = await invokeApiHandler(adminTablesHandler, {
      url: '/api/admin/tables',
      ip: '127.0.5.13',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      error: 'Unauthorized',
      code: 'unauthorized',
    })
  })

  it('rejects generic admin table access without an authenticated session', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      url: '/api/admin/table?table=projects',
      ip: '127.0.5.14',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      error: 'Unauthorized',
      code: 'unauthorized',
    })
  })

  it('rejects admin table requests for disallowed tables', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      url: '/api/admin/table?table=definitely_not_allowed',
      ip: '127.0.5.15',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      error: 'Table not allowed',
      code: 'table_not_allowed',
    })
  })

  it('rejects invalid limit values before reaching the DB layer', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      url: '/api/admin/table?table=projects&limit=not-a-number',
      ip: '127.0.5.16',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      error: 'Invalid limit parameter',
      code: 'internal_error',
    })
  })

  it('rejects patch requests with missing primary key fields', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      method: 'PATCH',
      url: '/api/admin/table?table=social_links',
      ip: '127.0.5.17',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
      body: {
        keys: {
          profile_id: 1,
        },
        row: {
          name: 'Should fail',
        },
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      error: 'Missing primary key fields in keys payload',
      code: 'missing_primary_keys',
    })
  })

  it('rejects patch requests that contain no mutable fields', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      method: 'PATCH',
      url: '/api/admin/table?table=social_links',
      ip: '127.0.5.18',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
      body: {
        keys: {
          profile_id: 1,
          order_index: 1,
        },
        row: {
          profile_id: 1,
          order_index: 1,
        },
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      error: 'No mutable fields in row payload',
      code: 'internal_error',
    })
  })

  it('rejects row payloads with unknown columns', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      method: 'POST',
      url: '/api/admin/table?table=social_links',
      ip: '127.0.5.19',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
      body: {
        row: {
          profile_id: 1,
          order_index: 999999,
          name: 'Unknown column test',
          url: 'https://example.com/unknown-column',
          icon_key: 'github',
          not_a_real_column: true,
        },
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      error: 'Unknown columns in row payload: not_a_real_column',
      code: 'internal_error',
    })
  })

  it('rejects empty body payloads for create requests', async () => {
    const response = await invokeApiHandler(adminTableHandler, {
      method: 'POST',
      url: '/api/admin/table?table=social_links',
      ip: '127.0.5.20',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
      body: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      error: 'Missing row payload',
      code: 'invalid_request',
    })
  })
})
