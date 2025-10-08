import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/artists/route'
import * as server from '@/lib/server'
import { mockLibraryData, createMockArtist } from '../../mocks/data'
import type { Artist } from '@/lib/data'

vi.mock('@/lib/server')

describe('GET /api/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all artists (200)', async () => {
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)

    const req = new NextRequest('http://localhost:3000/api/artists')
    const response = await GET(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual(mockLibraryData.artists)
    expect(server.getArtists).toHaveBeenCalledOnce()
  })

  it('should return 500 on server error', async () => {
    vi.mocked(server.getArtists).mockRejectedValue(new Error('Database error'))

    const req = new NextRequest('http://localhost:3000/api/artists')
    const response = await GET(req)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toEqual({ status: 'error', message: 'Failed to fetch artists' })
  })
})

describe('POST /api/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create single artist (201)', async () => {
    const newArtist = createMockArtist({ displayName: 'New Artist', rymId: 'new-artist' })
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'POST',
      body: JSON.stringify(newArtist),
    })
    const response = await POST(req)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.message).toContain('Successfully added 1 artist(s)')
    expect(data.added).toHaveLength(1)
    expect(data.added[0]).toEqual(newArtist)
    expect(data.artists).toHaveLength(mockLibraryData.artists.length + 1)
    expect(server.updateArtists).toHaveBeenCalledWith([...mockLibraryData.artists, newArtist])
  })

  it('should create multiple artists (201)', async () => {
    const newArtists = [
      createMockArtist({ displayName: 'Artist 1', rymId: 'artist-1' }),
      createMockArtist({ displayName: 'Artist 2', rymId: 'artist-2' }),
    ]
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'POST',
      body: JSON.stringify(newArtists),
    })
    const response = await POST(req)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.message).toContain('Successfully added 2 artist(s)')
    expect(data.added).toHaveLength(2)
    expect(data.artists).toHaveLength(mockLibraryData.artists.length + 2)
  })

  it('should skip duplicate artists', async () => {
    const existingArtist = mockLibraryData.artists[0]
    const newArtist = createMockArtist({ displayName: 'New Artist', rymId: 'new-artist' })
    const duplicateAttempt = [existingArtist, newArtist]

    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'POST',
      body: JSON.stringify(duplicateAttempt),
    })
    const response = await POST(req)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.message).toContain('Successfully added 1 artist(s)')
    expect(data.added).toHaveLength(1)
    expect(data.skipped).toHaveLength(1)
    expect(data.skipped[0].reason).toBe('Duplicate rymId')
  })

  it('should reject invalid artist data (400)', async () => {
    const invalidArtist = { displayName: 'Invalid', rymId: 123 } as unknown as Artist

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'POST',
      body: JSON.stringify(invalidArtist),
    })
    const response = await POST(req)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.message).toContain('Invalid artist data')
    expect(data.invalidData).toBeDefined()
  })

  it('should reject empty request body (400)', async () => {
    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'POST',
      body: JSON.stringify([]),
    })
    const response = await POST(req)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.message).toBe('Request body cannot be empty.')
  })

  it('should return skipped artists in response', async () => {
    const existingArtist = mockLibraryData.artists[0]
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'POST',
      body: JSON.stringify([existingArtist]),
    })
    const response = await POST(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toContain('No new artists were added')
    expect(data.skipped).toHaveLength(1)
    expect(data.skipped[0].artist).toEqual(existingArtist)
    expect(data.skipped[0].reason).toBe('Duplicate rymId')
  })
})

describe('PUT /api/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update single artist (200)', async () => {
    const artistToUpdate = { ...mockLibraryData.artists[0], displayName: 'Updated Name' }
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'PUT',
      body: JSON.stringify(artistToUpdate),
    })
    const response = await PUT(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('Artists updated successfully.')
    expect(data.updated).toHaveLength(1)
    expect(data.updated[0].displayName).toBe('Updated Name')
    expect(server.updateArtists).toHaveBeenCalled()
  })

  it('should update multiple artists (200)', async () => {
    const artist1Update = { ...mockLibraryData.artists[0], displayName: 'Updated 1' }
    const artist2Update = { ...mockLibraryData.artists[1], displayName: 'Updated 2' }

    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'PUT',
      body: JSON.stringify([artist1Update, artist2Update]),
    })
    const response = await PUT(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('Artists updated successfully.')
    expect(data.updated).toHaveLength(2)
    expect(data.updated[0].displayName).toBe('Updated 1')
    expect(data.updated[1].displayName).toBe('Updated 2')
  })

  it('should return 404 for non-existent artist', async () => {
    const nonExistentArtist = createMockArtist({ rymId: 'non-existent' })
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'PUT',
      body: JSON.stringify(nonExistentArtist),
    })
    const response = await PUT(req)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.message).toBe('No matching artists found to update.')
    expect(data.notFoundIds).toContain('non-existent')
  })

  it('should require rymId field (400)', async () => {
    const invalidUpdate = { displayName: 'No RymId' } as Artist

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
    })
    const response = await PUT(req)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.message).toContain('Invalid update data')
    expect(data.message).toContain('rymId')
  })

  it('should handle partial updates', async () => {
    const partialUpdate = {
      rymId: mockLibraryData.artists[0].rymId,
      rymUrl: 'https://new-url.com',
    }
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest('http://localhost:3000/api/artists', {
      method: 'PUT',
      body: JSON.stringify(partialUpdate),
    })
    const response = await PUT(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.updated[0].rymUrl).toBe('https://new-url.com')
    expect(data.updated[0].displayName).toBe(mockLibraryData.artists[0].displayName)
  })
})

describe('DELETE /api/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete artist by rymId (200)', async () => {
    const artistToDelete = mockLibraryData.artists[0]
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)
    vi.mocked(server.updateArtists).mockResolvedValue()

    const req = new NextRequest(
      `http://localhost:3000/api/artists?rymId=${artistToDelete.rymId}`
    )
    const response = await DELETE(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toContain('deleted successfully')
    expect(data.artists).toHaveLength(mockLibraryData.artists.length - 1)
    expect(data.artists.some((a: Artist) => a.rymId === artistToDelete.rymId)).toBe(false)
    expect(server.updateArtists).toHaveBeenCalled()
  })

  it('should return 404 for non-existent artist', async () => {
    vi.mocked(server.getArtists).mockResolvedValue(mockLibraryData.artists)

    const req = new NextRequest('http://localhost:3000/api/artists?rymId=non-existent')
    const response = await DELETE(req)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.message).toContain('not found')
  })

  it('should require rymId parameter (400)', async () => {
    const req = new NextRequest('http://localhost:3000/api/artists')
    const response = await DELETE(req)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.message).toContain('Missing `rymId` query parameter')
  })
})
