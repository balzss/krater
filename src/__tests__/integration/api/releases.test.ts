import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/releases/route'
import * as serverLib from '@/lib/server'
import fs from 'fs/promises'
import { mockLibraryData, createMockRelease } from '../../mocks/data'

vi.mock('@/lib/server')
vi.mock('fs/promises')

describe('Releases API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks for common operations
    vi.mocked(serverLib.getReleases).mockResolvedValue([...mockLibraryData.releases])
    vi.mocked(serverLib.updateReleases).mockResolvedValue(undefined)
    vi.mocked(serverLib.ensureDirectoryExists).mockResolvedValue(undefined)
    vi.mocked(serverLib.deleteCoverFile).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
  })

  describe('GET /api/releases', () => {
    it('should return all releases (200)', async () => {
      const request = new NextRequest('http://localhost:3000/api/releases')

      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockLibraryData.releases)
      expect(serverLib.getReleases).toHaveBeenCalledOnce()
    })

    it('should return 500 on server error', async () => {
      vi.mocked(serverLib.getReleases).mockRejectedValue(new Error('Database error'))
      const request = new NextRequest('http://localhost:3000/api/releases')

      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.message).toBe('Failed to fetch releases')
    })
  })

  describe('POST /api/releases', () => {
    it('should create new release with valid data (201)', async () => {
      const newRelease = createMockRelease({
        title: 'New Album',
        rymId: 'new-album',
        artistRymIds: ['test-artist'],
        cover: 'new-album.jpg',
        media: { spotify: 'https://spotify.com/album/new' },
      })

      const formData = new FormData()
      formData.append('title', newRelease.title)
      formData.append('rymId', newRelease.rymId)
      formData.append('cover', newRelease.cover)
      formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
      formData.append('media', JSON.stringify(newRelease.media))

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.message).toBe('Release added successfully')
      expect(data.release).toMatchObject({
        title: newRelease.title,
        rymId: newRelease.rymId,
        cover: newRelease.cover,
      })
      expect(serverLib.updateReleases).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: newRelease.title,
            rymId: newRelease.rymId,
          }),
        ])
      )
    })

    it('should reject duplicate rymId (400)', async () => {
      const duplicateRelease = createMockRelease({
        rymId: mockLibraryData.releases[0].rymId, // Use existing rymId
      })

      const formData = new FormData()
      formData.append('title', duplicateRelease.title)
      formData.append('rymId', duplicateRelease.rymId)
      formData.append('cover', duplicateRelease.cover)
      formData.append('artistRymIds', JSON.stringify(duplicateRelease.artistRymIds))
      formData.append('media', JSON.stringify(duplicateRelease.media))

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('already exists')
    })

    it('should reject missing required fields (400)', async () => {
      const formData = new FormData()
      formData.append('title', 'Missing Fields Album')
      formData.append('cover', 'missing.jpg')
      // Missing rymId, artistRymIds, and media

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('Missing required fields')
    })

    it('should handle cover file upload', async () => {
      const newRelease = createMockRelease({
        rymId: 'with-upload',
        cover: 'uploaded-cover.jpg',
      })

      const coverBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' })
      const coverFile = new File([coverBlob], 'uploaded-cover.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('title', newRelease.title)
      formData.append('rymId', newRelease.rymId)
      formData.append('cover', newRelease.cover)
      formData.append('coverImage', coverFile)
      formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
      formData.append('media', JSON.stringify(newRelease.media))

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('uploaded-cover.jpg'),
        expect.any(Buffer)
      )
      expect(serverLib.ensureDirectoryExists).toHaveBeenCalled()
    })

    it('should normalize unicode in cover filenames', async () => {
      const newRelease = createMockRelease({
        rymId: 'unicode-test',
        cover: 'café.jpg', // Unicode character
      })

      const formData = new FormData()
      formData.append('title', newRelease.title)
      formData.append('rymId', newRelease.rymId)
      formData.append('cover', encodeURIComponent('café.jpg'))
      formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
      formData.append('media', JSON.stringify(newRelease.media))

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.release.cover).toBe('café.jpg'.normalize('NFC'))
    })

    it('should reject invalid JSON in artistRymIds (400)', async () => {
      const formData = new FormData()
      formData.append('title', 'Invalid JSON Test')
      formData.append('rymId', 'invalid-json-test')
      formData.append('cover', 'test.jpg')
      formData.append('artistRymIds', 'not-valid-json{')
      formData.append('media', '{}')

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('Invalid JSON format for artistRymIds')
    })

    it('should reject invalid JSON in media (400)', async () => {
      const formData = new FormData()
      formData.append('title', 'Invalid Media JSON')
      formData.append('rymId', 'invalid-media-test')
      formData.append('cover', 'test.jpg')
      formData.append('artistRymIds', '["test-artist"]')
      formData.append('media', 'not-valid-json{')

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('Invalid JSON format for media')
    })

    it('should reject empty artistRymIds array (400)', async () => {
      const formData = new FormData()
      formData.append('title', 'Empty Artists')
      formData.append('rymId', 'empty-artists')
      formData.append('cover', 'test.jpg')
      formData.append('artistRymIds', '[]')
      formData.append('media', '{}')

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('non-empty')
    })

    it('should call ensureDirectoryExists', async () => {
      const newRelease = createMockRelease({ rymId: 'ensure-dir-test' })

      const formData = new FormData()
      formData.append('title', newRelease.title)
      formData.append('rymId', newRelease.rymId)
      formData.append('cover', newRelease.cover)
      formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
      formData.append('media', JSON.stringify(newRelease.media))

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'POST',
        body: formData,
      })

      await POST(request)

      expect(serverLib.ensureDirectoryExists).toHaveBeenCalledWith(
        expect.stringContaining('covers')
      )
    })
  })

  describe('PUT /api/releases', () => {
    it('should update existing release (200)', async () => {
      const existingRelease = mockLibraryData.releases[0]
      const updatedTitle = 'Updated Title'

      const formData = new FormData()
      formData.append('rymId', existingRelease.rymId)
      formData.append('title', updatedTitle)

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Release updated successfully')
      expect(data.release.title).toBe(updatedTitle)
      expect(data.release.rymId).toBe(existingRelease.rymId)
      expect(serverLib.updateReleases).toHaveBeenCalled()
    })

    it('should return 404 for non-existent release', async () => {
      const formData = new FormData()
      formData.append('rymId', 'non-existent-rymid')
      formData.append('title', 'Updated Title')

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.message).toContain('not found')
    })

    it('should handle cover replacement', async () => {
      const existingRelease = mockLibraryData.releases[0]
      const newCoverFilename = 'new-cover.jpg'

      const coverBlob = new Blob(['new-image-data'], { type: 'image/jpeg' })
      const coverFile = new File([coverBlob], newCoverFilename, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('rymId', existingRelease.rymId)
      formData.append('cover', newCoverFilename)
      formData.append('coverImage', coverFile)

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(newCoverFilename),
        expect.any(Buffer)
      )
    })

    it('should delete old cover when filename changes', async () => {
      const existingRelease = mockLibraryData.releases[0]
      const oldCoverFilename = existingRelease.cover
      const newCoverFilename = 'replacement-cover.jpg'

      const coverBlob = new Blob(['replacement-data'], { type: 'image/jpeg' })
      const coverFile = new File([coverBlob], newCoverFilename, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('rymId', existingRelease.rymId)
      formData.append('cover', newCoverFilename)
      formData.append('coverImage', coverFile)

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(serverLib.deleteCoverFile).toHaveBeenCalledWith(oldCoverFilename)
    })

    it('should preserve original values for unspecified fields', async () => {
      const existingRelease = mockLibraryData.releases[0]
      const originalTitle = existingRelease.title
      const originalCover = existingRelease.cover

      const formData = new FormData()
      formData.append('rymId', existingRelease.rymId)
      formData.append('rymUrl', 'https://new-url.com')
      // Not specifying title or cover

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.release.title).toBe(originalTitle)
      expect(data.release.cover).toBe(originalCover)
      expect(data.release.rymUrl).toBe('https://new-url.com')
    })

    it('should handle unicode normalization', async () => {
      const existingRelease = mockLibraryData.releases[0]
      const unicodeCoverName = 'müsic.jpg'

      const formData = new FormData()
      formData.append('rymId', existingRelease.rymId)
      formData.append('cover', encodeURIComponent(unicodeCoverName))

      const coverBlob = new Blob(['unicode-data'], { type: 'image/jpeg' })
      const coverFile = new File([coverBlob], unicodeCoverName, { type: 'image/jpeg' })
      formData.append('coverImage', coverFile)

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.release.cover).toBe(unicodeCoverName.normalize('NFC'))
    })

    it('should reject missing rymId (400)', async () => {
      const formData = new FormData()
      formData.append('title', 'Updated Title')
      // Missing rymId

      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'PUT',
        body: formData,
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('Missing')
      expect(data.message).toContain('rymId')
    })
  })

  describe('DELETE /api/releases', () => {
    it('should delete release by rymId (200)', async () => {
      const releaseToDelete = mockLibraryData.releases[0]

      const request = new NextRequest(
        `http://localhost:3000/api/releases?rymId=${releaseToDelete.rymId}`,
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toContain('deleted successfully')
      expect(serverLib.updateReleases).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ rymId: releaseToDelete.rymId })])
      )
    })

    it('should delete associated cover file', async () => {
      const releaseToDelete = mockLibraryData.releases[0]
      const coverFilename = releaseToDelete.cover

      const request = new NextRequest(
        `http://localhost:3000/api/releases?rymId=${releaseToDelete.rymId}`,
        {
          method: 'DELETE',
        }
      )

      const response = await DELETE(request)

      expect(response.status).toBe(200)
      expect(serverLib.deleteCoverFile).toHaveBeenCalledWith(coverFilename)
    })

    it('should return 404 for non-existent release', async () => {
      const request = new NextRequest('http://localhost:3000/api/releases?rymId=non-existent-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.message).toContain('not found')
    })

    it('should require rymId parameter (400)', async () => {
      const request = new NextRequest('http://localhost:3000/api/releases', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('Missing')
      expect(data.message).toContain('rymId')
    })
  })
})
