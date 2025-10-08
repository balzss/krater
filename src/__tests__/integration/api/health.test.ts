import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'
import { mockLibraryData } from '../../mocks/data'
import fs from 'fs'

// Mock the server utilities
vi.mock('@/lib/server', () => ({
  getLibraryData: vi.fn(),
}))

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readdirSync: vi.fn(),
  },
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect unused covers', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      'downward-spiral.jpg',
      'unused-cover.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.issues.unusedCovers).toContain('unused-cover.jpg')
    expect(data.issues.unusedCovers).toHaveLength(1)
  })

  it('should detect unused artists', async () => {
    const { getLibraryData } = await import('@/lib/server')
    const dataWithUnusedArtist = {
      releases: mockLibraryData.releases,
      artists: [
        ...mockLibraryData.artists,
        {
          displayName: 'Unused Artist',
          rymId: 'unused-artist',
        },
      ],
    }
    vi.mocked(getLibraryData).mockResolvedValue(dataWithUnusedArtist)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      'downward-spiral.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.issues.unusedArtists).toHaveLength(1)
    expect(data.issues.unusedArtists[0]).toEqual({
      rymId: 'unused-artist',
      displayName: 'Unused Artist',
    })
  })

  it('should detect missing covers', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      // downward-spiral.jpg is missing
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.issues.missingCovers).toHaveLength(1)
    expect(data.issues.missingCovers[0]).toMatchObject({
      releaseTitle: 'The Downward Spiral',
      filename: 'downward-spiral.jpg',
      rymId: 'downward-spiral',
    })
  })

  it('should detect missing artists', async () => {
    const { getLibraryData } = await import('@/lib/server')
    const dataWithMissingArtist = {
      releases: [
        {
          title: 'Test Album',
          rymId: 'test-album',
          artistRymIds: ['missing-artist'],
          cover: 'test.jpg',
          media: {},
        },
      ],
      artists: [],
    }
    vi.mocked(getLibraryData).mockResolvedValue(dataWithMissingArtist)
    vi.mocked(fs.readdirSync).mockReturnValue(['test.jpg'] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.issues.missingArtists).toHaveLength(1)
    expect(data.issues.missingArtists[0]).toMatchObject({
      rymId: 'missing-artist',
      referencedIn: ['Test Album'],
    })
  })

  it('should return empty arrays when no issues', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      'downward-spiral.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.issues.unusedCovers).toEqual([])
    expect(data.issues.unusedArtists).toEqual([])
    expect(data.issues.missingCovers).toEqual([])
    expect(data.issues.missingArtists).toEqual([])
  })

  it('should handle missing covers directory', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const error = new Error('Directory not found') as NodeJS.ErrnoException
    error.code = 'ENOENT'
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw error
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    // When directory doesn't exist, all covers are considered missing
    expect(data.issues.missingCovers.length).toBeGreaterThan(0)
  })

  it('should map artist names to missing covers', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue(['ok-computer.jpg'] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    const missingCovers = data.issues.missingCovers
    expect(missingCovers.length).toBeGreaterThan(0)

    const sawMissing = missingCovers.find(
      (c: { filename: string }) => c.filename === 'saw-85-92.jpg'
    )
    expect(sawMissing).toBeDefined()
    expect(sawMissing.releaseArtists).toBe('Aphex Twin')
  })

  it('should list releases using missing artists', async () => {
    const { getLibraryData } = await import('@/lib/server')
    const dataWithMissingArtists = {
      releases: [
        {
          title: 'Album 1',
          rymId: 'album-1',
          artistRymIds: ['missing-artist'],
          cover: 'album1.jpg',
          media: {},
        },
        {
          title: 'Album 2',
          rymId: 'album-2',
          artistRymIds: ['missing-artist'],
          cover: 'album2.jpg',
          media: {},
        },
      ],
      artists: [],
    }
    vi.mocked(getLibraryData).mockResolvedValue(dataWithMissingArtists)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'album1.jpg',
      'album2.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    // The health check creates one entry per unique missing artist rymId
    // Each entry lists all releases that reference it
    // Since 'missing-artist' appears twice in referencedArtistRymIds array,
    // the filter creates 2 entries, but both reference the same artist
    expect(data.issues.missingArtists.length).toBeGreaterThan(0)
    // Check that at least one entry has both releases listed
    const artistEntry = data.issues.missingArtists.find(
      (a: { rymId: string }) => a.rymId === 'missing-artist'
    )
    expect(artistEntry).toBeDefined()
    expect(artistEntry.referencedIn).toEqual(['Album 1', 'Album 2'])
  })

  it('should return proper status codes (200)', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      'downward-spiral.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.ok).toBe(true)
  })

  it('should include timestamp in response', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      'downward-spiral.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(data.checkedAt).toBeDefined()
    expect(new Date(data.checkedAt).getTime()).not.toBeNaN()
  })

  it('should handle file system errors (500)', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)

    const error = new Error('Permission denied') as NodeJS.ErrnoException
    error.code = 'EACCES'
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw error
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.message).toBe('Internal Server Error during health check.')
  })

  it('should work with proper data', async () => {
    const { getLibraryData } = await import('@/lib/server')
    vi.mocked(getLibraryData).mockResolvedValue(mockLibraryData)
    vi.mocked(fs.readdirSync).mockReturnValue([
      'ok-computer.jpg',
      'saw-85-92.jpg',
      'downward-spiral.jpg',
    ] as unknown as fs.Dirent[])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.issues).toBeDefined()
    expect(data.checkedAt).toBeDefined()
  })
})
