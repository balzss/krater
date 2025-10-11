import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/library-data/route'
import { mockLibraryData } from '../../mocks/data'

// Mock the server utilities
vi.mock('@/lib/server', () => ({
  getLibraryData: vi.fn(),
  setLibraryData: vi.fn(),
}))

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { user: { id: 'test-user' } },
    response: null,
  }),
}))

describe('GET /api/library-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return library data with timestamp (200)', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.libraryData).toEqual(mockLibraryData)
    expect(data.checkedAt).toBeDefined()
    expect(new Date(data.checkedAt).getTime()).not.toBeNaN()
  })

  it('should return 500 on file read error', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockRejectedValue(new Error('File read error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.message).toBe('Internal Server Error during getting library data.')
  })
})

describe('POST /api/library-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save library data (200)', async () => {
    const { setLibraryData } = await import('@/lib/server')
    vi.mocked(setLibraryData).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/library-data', {
      method: 'POST',
      body: JSON.stringify(mockLibraryData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.message).toBe('Data saved successfully.')
    expect(setLibraryData).toHaveBeenCalledWith(mockLibraryData)
  })

  it('should return 400 on empty body', async () => {
    const request = new Request('http://localhost:3000/api/library-data', {
      method: 'POST',
      body: JSON.stringify(null),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.status).toBe('error')
    expect(data.message).toBe('No data received in request body.')
  })

  it('should return 400 on invalid JSON', async () => {
    const request = new Request('http://localhost:3000/api/library-data', {
      method: 'POST',
      body: 'invalid json{',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.status).toBe('error')
    expect(data.message).toBe('Invalid JSON format in request body.')
  })

  it('should return success timestamp', async () => {
    const { setLibraryData } = await import('@/lib/server')
    vi.mocked(setLibraryData).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/library-data', {
      method: 'POST',
      body: JSON.stringify(mockLibraryData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.savedAt).toBeDefined()
    expect(new Date(data.savedAt).getTime()).not.toBeNaN()
  })

  it('should validate data structure', async () => {
    const { setLibraryData } = await import('@/lib/server')
    vi.mocked(setLibraryData).mockResolvedValue(undefined)

    const validData = {
      releases: mockLibraryData.releases,
      artists: mockLibraryData.artists,
    }

    const request = new Request('http://localhost:3000/api/library-data', {
      method: 'POST',
      body: JSON.stringify(validData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(setLibraryData).toHaveBeenCalledWith(validData)
  })

  it('should handle write errors (500)', async () => {
    const { setLibraryData } = await import('@/lib/server')
    vi.mocked(setLibraryData).mockRejectedValue(new Error('Write error'))

    const request = new Request('http://localhost:3000/api/library-data', {
      method: 'POST',
      body: JSON.stringify(mockLibraryData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.message).toBe('Internal Server Error during saving data.')
  })
})
