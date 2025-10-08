import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { GET as meGET } from '@/app/api/auth/me/route'

// Mock Next.js cookies
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ADMIN_SECRET
  })

  it('should succeed with valid secret (200)', async () => {
    process.env.ADMIN_SECRET = 'test-secret'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'test-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.isAdmin).toBe(true)
  })

  it('should fail with invalid secret (401)', async () => {
    process.env.ADMIN_SECRET = 'test-secret'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'wrong-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toBe('Invalid secret')
  })

  it('should set httpOnly cookie on success', async () => {
    process.env.ADMIN_SECRET = 'test-secret'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'test-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await loginPOST(request)

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'admin-session',
      'true',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
      })
    )
  })

  it('should return 400 on invalid JSON', async () => {
    process.env.ADMIN_SECRET = 'test-secret'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json{',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Invalid JSON body')
  })

  it('should return 400 on missing secret', async () => {
    process.env.ADMIN_SECRET = 'test-secret'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Secret must be a string.')
  })

  it('should return 500 when ADMIN_SECRET not set', async () => {
    delete process.env.ADMIN_SECRET

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'test-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Configuration error: Admin secret not set.')
  })

  it('should set secure cookie in production', async () => {
    process.env.ADMIN_SECRET = 'test-secret'
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'test-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await loginPOST(request)

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'admin-session',
      'true',
      expect.objectContaining({
        secure: true,
      })
    )

    process.env.NODE_ENV = originalEnv
  })

  it('should not set secure cookie in development', async () => {
    process.env.ADMIN_SECRET = 'test-secret'
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'test-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await loginPOST(request)

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'admin-session',
      'true',
      expect.objectContaining({
        secure: false,
      })
    )

    process.env.NODE_ENV = originalEnv
  })

  it('should set cookie with proper maxAge', async () => {
    process.env.ADMIN_SECRET = 'test-secret'

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret: 'test-secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await loginPOST(request)

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'admin-session',
      'true',
      expect.objectContaining({
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    )
  })
})

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should clear session cookie (200)', async () => {
    const response = await logoutPOST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Logout successful')
    expect(mockCookieStore.delete).toHaveBeenCalledWith('admin-session')
  })

  it('should always return success', async () => {
    const response1 = await logoutPOST()
    const response2 = await logoutPOST()

    expect(response1.status).toBe(200)
    expect(response2.status).toBe(200)
  })
})

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isAdmin true when authenticated (200)', async () => {
    mockCookieStore.get.mockReturnValue({
      name: 'admin-session',
      value: 'true',
    })

    const request = new Request('http://localhost:3000/api/auth/me')
    const response = await meGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isAdmin).toBe(true)
  })

  it('should return isAdmin false when not authenticated (200)', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const request = new Request('http://localhost:3000/api/auth/me')
    const response = await meGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isAdmin).toBe(false)
  })

  it('should check admin-session cookie', async () => {
    mockCookieStore.get.mockReturnValue({
      name: 'admin-session',
      value: 'true',
    })

    const request = new Request('http://localhost:3000/api/auth/me')
    await meGET(request)

    expect(mockCookieStore.get).toHaveBeenCalledWith('admin-session')
  })

  it('should handle missing cookie', async () => {
    mockCookieStore.get.mockReturnValue(null)

    const request = new Request('http://localhost:3000/api/auth/me')
    const response = await meGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isAdmin).toBe(false)
  })

  it('should return false for invalid cookie value', async () => {
    mockCookieStore.get.mockReturnValue({
      name: 'admin-session',
      value: 'false',
    })

    const request = new Request('http://localhost:3000/api/auth/me')
    const response = await meGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isAdmin).toBe(false)
  })
})
