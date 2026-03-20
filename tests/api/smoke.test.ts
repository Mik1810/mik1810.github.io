import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockSendContactMessage = vi.hoisted(() => vi.fn())
const mockLoginAdmin = vi.hoisted(() => vi.fn())
const mockSqlClient = vi.hoisted(() => vi.fn())
const mockGetAllowedAdminTable = vi.hoisted(() => vi.fn())
const mockGetAdminRows = vi.hoisted(() => vi.fn())

vi.mock('../../lib/services/contactService.ts', () => ({
  sendContactMessage: mockSendContactMessage,
}))

vi.mock('../../lib/services/adminAuthService.ts', async () => {
  const actual = await vi.importActual<
    typeof import('../../lib/services/adminAuthService.ts')
  >('../../lib/services/adminAuthService.ts')

  return {
    ...actual,
    loginAdmin: mockLoginAdmin,
  }
})

vi.mock('../../lib/db/client.ts', async () => {
  const actual = await vi.importActual<typeof import('../../lib/db/client.ts')>(
    '../../lib/db/client.ts'
  )

  return {
    ...actual,
    sqlClient: mockSqlClient,
  }
})

vi.mock('../../lib/services/adminTableService.ts', async () => {
  const actual = await vi.importActual<
    typeof import('../../lib/services/adminTableService.ts')
  >('../../lib/services/adminTableService.ts')

  return {
    ...actual,
    getAllowedAdminTable: mockGetAllowedAdminTable,
    getAdminRows: mockGetAdminRows,
  }
})

import aboutHandler from '../../api/about.ts'
import contactHandler from '../../api/contact.ts'
import experiencesHandler from '../../api/experiences.ts'
import healthHandler from '../../api/health.ts'
import profileHandler from '../../api/profile.ts'
import projectsHandler from '../../api/projects.ts'
import skillsHandler from '../../api/skills.ts'
import adminHealthHandler from '../../api/admin/health.ts'
import adminEnvironmentHandler from '../../api/admin/environment.ts'
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

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

const createAdminCookieHeader = () =>
  createSessionCookie(
    createSessionToken({
      id: 'admin_smoke',
      email: 'admin@example.com',
    })
  )

beforeEach(() => {
  mockSendContactMessage.mockReset()
  mockLoginAdmin.mockReset()
  mockSqlClient.mockReset()
  mockGetAllowedAdminTable.mockReset()
  mockGetAdminRows.mockReset()

  mockSendContactMessage.mockResolvedValue({ id: 'email_smoke_123' })
  mockLoginAdmin.mockResolvedValue({
    user: {
      id: 'admin_smoke',
      email: 'admin@example.com',
    },
    cookie: createAdminCookieHeader(),
  })
  mockSqlClient.mockResolvedValue([{ ok: 1 }])
  mockGetAllowedAdminTable.mockImplementation((table) =>
    typeof table === 'string' && table.length > 0 ? table : null
  )
  mockGetAdminRows.mockResolvedValue([{ id: 1 }])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Smoke checks', () => {
  it('homepage shell exposes the expected root, title, and valid module entry', async () => {
    const html = await readFile(path.join(repoRoot, 'index.html'), 'utf8')

    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain('<title>Michael Piccirilli | Portfolio</title>')

    const moduleEntryMatch = html.match(
      /<script\s+type="module"\s+src="(?<src>[^"]+)"><\/script>/
    )

    expect(moduleEntryMatch?.groups?.src).toBe('/src/main.tsx')

    const entryPath = path.join(
      repoRoot,
      moduleEntryMatch?.groups?.src?.replace(/^\//, '') ?? ''
    )

    await expect(access(entryPath)).resolves.toBeUndefined()
  })

  it('smoke-checks every public endpoint', async () => {
    const publicCases = [
      [aboutHandler, '/api/about?lang=it', '127.0.3.11'],
      [profileHandler, '/api/profile?lang=it', '127.0.3.12'],
      [projectsHandler, '/api/projects?lang=it', '127.0.3.13'],
      [skillsHandler, '/api/skills?lang=it', '127.0.3.14'],
      [experiencesHandler, '/api/experiences?lang=it', '127.0.3.15'],
    ] as const

    for (const [handler, url, ip] of publicCases) {
      const response = await invokeApiHandler(handler, { url, ip })
      expect(response.statusCode).toBe(200)
      expect(response.body).toBeTruthy()
    }

    const healthResponse = await invokeApiHandler(healthHandler, {
      url: '/api/health',
      ip: '127.0.3.16',
    })

    expect(healthResponse.statusCode).toBe(200)
    expect(healthResponse.body).toBeTruthy()

    const contactResponse = await invokeApiHandler(contactHandler, {
      method: 'POST',
      url: '/api/contact',
      ip: '127.0.3.17',
      body: {
        name: 'Mario Rossi',
        email: 'mario@example.com',
        message: 'Ciao Michael, smoke test del contact form.',
        locale: 'it',
        website: '',
      },
    })

    expect(contactResponse.statusCode).toBe(200)
    expect(mockSendContactMessage).toHaveBeenCalledTimes(1)
  })

  it('smoke-checks every admin endpoint', async () => {
    const anonymousSessionResponse = await invokeApiHandler(adminSessionHandler, {
      url: '/api/admin/session',
      ip: '127.0.3.21',
    })

    expect(anonymousSessionResponse.statusCode).toBe(200)
    expect(anonymousSessionResponse.body).toEqual({
      authenticated: false,
      user: null,
    })

    const adminCookie = createAdminCookieHeader()

    const authenticatedSessionResponse = await invokeApiHandler(
      adminSessionHandler,
      {
        url: '/api/admin/session',
        ip: '127.0.3.22',
        headers: {
          host: 'localhost',
          cookie: adminCookie,
        },
      }
    )

    expect(authenticatedSessionResponse.statusCode).toBe(200)
    expect(authenticatedSessionResponse.body).toEqual({
      authenticated: true,
      user: {
        id: 'admin_smoke',
        email: 'admin@example.com',
      },
    })

    const loginResponse = await invokeApiHandler(adminLoginHandler, {
      method: 'POST',
      url: '/api/admin/login',
      ip: '127.0.3.23',
      body: {
        email: 'admin@example.com',
        password: 'smoke-password',
      },
    })

    expect(loginResponse.statusCode).toBe(200)
    expect(loginResponse.getHeader('set-cookie')).toBe(adminCookie)
    expect(loginResponse.body).toEqual({
      user: {
        id: 'admin_smoke',
        email: 'admin@example.com',
      },
    })

    const logoutResponse = await invokeApiHandler(adminLogoutHandler, {
      method: 'POST',
      url: '/api/admin/logout',
      ip: '127.0.3.24',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
    })

    expect(logoutResponse.statusCode).toBe(200)
    expect(logoutResponse.body).toEqual({ ok: true })
    expect(String(logoutResponse.getHeader('set-cookie'))).toContain('Max-Age=0')

    const tablesResponse = await invokeApiHandler(adminTablesHandler, {
      url: '/api/admin/tables',
      ip: '127.0.3.25',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
    })

    expect(tablesResponse.statusCode).toBe(200)
    expect(tablesResponse.body).toEqual(
      expect.objectContaining({
        tables: expect.any(Array),
      })
    )

    const adminHealthResponse = await invokeApiHandler(adminHealthHandler, {
      url: '/api/admin/health',
      ip: '127.0.3.255',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
    })

    expect(adminHealthResponse.statusCode).toBe(200)
    expect(adminHealthResponse.body).toEqual(
      expect.objectContaining({
        ok: true,
        checks: expect.objectContaining({
          database: expect.objectContaining({
            ok: true,
          }),
        }),
      })
    )

    const adminEnvironmentResponse = await invokeApiHandler(
      adminEnvironmentHandler,
      {
        url: '/api/admin/environment',
        ip: '127.0.3.256',
        headers: {
          host: 'localhost',
          cookie: adminCookie,
        },
      }
    )

    expect(adminEnvironmentResponse.statusCode).toBe(200)
    expect(adminEnvironmentResponse.body).toEqual(
      expect.objectContaining({
        environmentVariables: expect.any(Array),
      })
    )

    const tableResponse = await invokeApiHandler(adminTableHandler, {
      url: '/api/admin/table?table=profile&limit=5',
      ip: '127.0.3.26',
      headers: {
        host: 'localhost',
        cookie: adminCookie,
      },
    })

    expect(tableResponse.statusCode).toBe(200)
    expect(tableResponse.body).toEqual({
      rows: [{ id: 1 }],
    })
    expect(mockGetAllowedAdminTable).toHaveBeenCalledWith('profile')
    expect(mockGetAdminRows).toHaveBeenCalledWith('profile', 5)
  })
})
