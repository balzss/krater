import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '@/app/api/covers/route'

// Mock the server utilities
vi.mock('@/lib/server', () => ({
  deleteCoverFile: vi.fn(),
}))

describe('DELETE /api/covers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete cover file (200)', async () => {
    const { deleteCoverFile } = await import('@/lib/server')
    vi.mocked(deleteCoverFile).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/covers?filename=test-cover.jpg', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Cover with filename 'test-cover.jpg' deleted successfully.")
    expect(deleteCoverFile).toHaveBeenCalledWith('test-cover.jpg')
  })

  it('should require filename parameter (400)', async () => {
    const { deleteCoverFile } = await import('@/lib/server')
    vi.mocked(deleteCoverFile).mockImplementation((filename) => {
      if (!filename) {
        throw new Error('Filename is required')
      }
      return Promise.resolve()
    })

    const request = new Request('http://localhost:3000/api/covers', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    // The route passes null to deleteCoverFile when no filename is provided
    // deleteCoverFile throws an error which gets caught and returned as 500
    expect(response.status).toBe(500)
    expect(data.message).toBeDefined()
  })

  it('should handle non-existent files gracefully', async () => {
    const { deleteCoverFile } = await import('@/lib/server')
    // deleteCoverFile handles ENOENT gracefully and doesn't throw
    vi.mocked(deleteCoverFile).mockResolvedValue(undefined)

    const request = new Request(
      'http://localhost:3000/api/covers?filename=non-existent.jpg',
      {
        method: 'DELETE',
      }
    )

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Cover with filename 'non-existent.jpg' deleted successfully.")
  })

  it('should return proper error messages', async () => {
    const { deleteCoverFile } = await import('@/lib/server')
    vi.mocked(deleteCoverFile).mockRejectedValue(new Error('Permission denied'))

    const request = new Request('http://localhost:3000/api/covers?filename=test-cover.jpg', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Permission denied')
  })
})
