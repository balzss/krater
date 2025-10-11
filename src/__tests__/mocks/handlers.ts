import { http, HttpResponse } from 'msw'
import { mockLibraryData } from './data'

export const handlers = [
  // GET /data/libraryData.json
  http.get('/data/libraryData.json', () => {
    return HttpResponse.json(mockLibraryData)
  }),

  // GET /api/library-data
  http.get('/api/library-data', () => {
    return HttpResponse.json({
      status: 'ok',
      libraryData: mockLibraryData,
      checkedAt: new Date().toISOString(),
    })
  }),

  // POST /api/library-data
  http.post('/api/library-data', async ({ request }) => {
    const _data = await request.json()
    return HttpResponse.json({
      status: 'ok',
      message: 'Data saved successfully.',
      savedAt: new Date().toISOString(),
    })
  }),

  // GET /api/auth/me
  http.get('/api/auth/me', ({ cookies }) => {
    const isAdmin = cookies['admin-session'] === 'true'
    return HttpResponse.json({ isAdmin })
  }),

  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.secret === 'test-secret') {
      return HttpResponse.json(
        { success: true, isAdmin: true },
        {
          headers: {
            'Set-Cookie': 'admin-session=true; Path=/; HttpOnly',
          },
        }
      )
    }
    return HttpResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json(
      { message: 'Logout successful' },
      {
        headers: {
          'Set-Cookie': 'admin-session=; Path=/; Max-Age=0',
        },
      }
    )
  }),

  // GET /api/auth/get-session (Better Auth)
  http.get('/api/auth/get-session', ({ cookies }) => {
    // Mock better-auth session endpoint
    const hasSession = cookies['better-auth.session_token'] === 'test-session'
    if (hasSession) {
      return HttpResponse.json({
        user: {
          id: 'test-user-id',
          email: 'admin@krater.local',
          name: 'Admin User',
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: 'test-session-id',
          userId: 'test-user-id',
          token: 'test-session',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    }
    return HttpResponse.json({ user: null, session: null })
  }),

  // POST /api/auth/sign-in/email (Better Auth)
  http.post('/api/auth/sign-in/email', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'admin@krater.local' && body.password === 'admin123') {
      return HttpResponse.json(
        {
          user: {
            id: 'test-user-id',
            email: 'admin@krater.local',
            name: 'Admin User',
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          session: {
            id: 'test-session-id',
            userId: 'test-user-id',
            token: 'test-session',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        {
          headers: {
            'Set-Cookie': 'better-auth.session_token=test-session; Path=/; HttpOnly',
          },
        }
      )
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }),

  // POST /api/auth/sign-out (Better Auth)
  http.post('/api/auth/sign-out', () => {
    return HttpResponse.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': 'better-auth.session_token=; Path=/; Max-Age=0',
        },
      }
    )
  }),

  // GET /api/health
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      issues: {
        unusedCovers: ['unused-cover.jpg'],
        unusedArtists: [{ rymId: 'unused', displayName: 'Unused Artist' }],
        missingCovers: [],
        missingArtists: [],
      },
      checkedAt: new Date().toISOString(),
    })
  }),
]
