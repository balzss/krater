import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/check/route'
import { mockLibraryData } from '../../mocks/data'

// Mock the server utilities
vi.mock('@/lib/server', () => ({
  getLibraryData: vi.fn(),
}))

describe('GET /api/check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should check for missing artists (200)', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const request = new Request('http://localhost:3000/api/check?artistId=missing-artist')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.missingArtists).toEqual(['missing-artist'])
    // When no releaseId is provided, the ternary expression evaluates to null
    // because: null && ... ? '' : null === null
    expect(data.missingRelease).toBeNull()
  })

  it('should check for missing release (200)', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const request = new Request('http://localhost:3000/api/check?releaseId=missing-release')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.missingRelease).toBe('missing-release')
    expect(data.missingArtists).toEqual([])
  })

  it('should return empty arrays when all exist', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const request = new Request(
      'http://localhost:3000/api/check?artistId=radiohead&releaseId=ok-computer'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.missingArtists).toEqual([])
    expect(data.missingRelease).toBe('')
  })

  it('should require query parameters (400)', async () => {
    const request = new Request('http://localhost:3000/api/check')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe(
      'Please provide either an artistIds or releaseId in the query string.'
    )
  })

  it('should handle multiple artist IDs', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const request = new Request(
      'http://localhost:3000/api/check?artistId=radiohead,missing-1,aphex-twin,missing-2'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.missingArtists).toEqual(['missing-1', 'missing-2'])
    expect(data.missingArtists).not.toContain('radiohead')
    expect(data.missingArtists).not.toContain('aphex-twin')
  })

  it('should handle comma-separated IDs', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const request = new Request(
      'http://localhost:3000/api/check?artistId=artist-1,artist-2,artist-3'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.missingArtists).toHaveLength(3)
    expect(data.missingArtists).toEqual(['artist-1', 'artist-2', 'artist-3'])
  })
})
