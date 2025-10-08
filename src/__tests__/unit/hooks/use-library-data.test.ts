import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLibraryData } from '@/hooks/use-library-data'
import { mockLibraryData } from '../../mocks/data'
import { server } from '../../../../vitest.setup'
import { http, HttpResponse } from 'msw'

describe('useLibraryData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('getLibraryData', () => {
    it('should fetch library data when enabled', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        expect(result.current.releases).toEqual(expect.any(Array))
        expect(result.current.artists).toEqual(expect.any(Array))
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should not fetch when enabled is false', async () => {
      let fetchCalled = false

      server.use(
        http.get('/data/libraryData.json', () => {
          fetchCalled = true
          return HttpResponse.json(mockLibraryData)
        })
      )

      renderHook(() => useLibraryData({ enabled: false }))

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(fetchCalled).toBe(false)
    })

    it('should handle fetch errors gracefully', async () => {
      server.use(
        http.get('/data/libraryData.json', () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.releases).toBeNull()
      expect(result.current.artists).toBeNull()
    })
  })

  describe('sorting', () => {
    it('should sort releases ascending by title', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result } = renderHook(() => useLibraryData({ enabled: true, releaseSort: 'asc' }))

      await waitFor(() => {
        const releases = result.current.releases
        if (releases && releases.length > 1) {
          expect(
            releases[0].title.localeCompare(releases[1].title, undefined, { sensitivity: 'base' })
          ).toBeLessThanOrEqual(0)
        }
      })
    })

    it('should sort releases descending by title', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result } = renderHook(() => useLibraryData({ enabled: true, releaseSort: 'desc' }))

      await waitFor(() => {
        const releases = result.current.releases
        if (releases && releases.length > 1) {
          expect(
            releases[0].title.localeCompare(releases[1].title, undefined, { sensitivity: 'base' })
          ).toBeGreaterThanOrEqual(0)
        }
      })
    })

    it('should sort artists alphabetically by default', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        const artists = result.current.artists
        if (artists && artists.length > 1) {
          expect(
            artists[0].displayName.localeCompare(artists[1].displayName, undefined, {
              sensitivity: 'base',
            })
          ).toBeLessThanOrEqual(0)
        }
      })
    })

    it('should randomize releases when sort is random', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result } = renderHook(() => useLibraryData({ enabled: true, releaseSort: 'random' }))

      await waitFor(() => {
        expect(result.current.releases).toEqual(expect.any(Array))
        expect(result.current.releases?.length).toBe(mockLibraryData.releases.length)
      })
    })
  })

  describe('setLibraryData', () => {
    it('should upload library data successfully', async () => {
      // Uses default MSW handler for POST /api/library-data

      const { result } = renderHook(() => useLibraryData())
      const file = new File([JSON.stringify(mockLibraryData)], 'library.json', {
        type: 'application/json',
      })

      const response = await result.current.setLibraryData(file)
      expect(response.status).toBe('ok')
    })

    it('should reject non-JSON files', async () => {
      const { result } = renderHook(() => useLibraryData())
      const file = new File(['test'], 'file.txt', { type: 'text/plain' })

      await expect(result.current.setLibraryData(file)).rejects.toThrow('Invalid file type')
    })

    it('should set loading state correctly', async () => {
      server.use(
        http.get('/data/libraryData.json', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return HttpResponse.json(mockLibraryData)
        })
      )

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      // Should be loading initially
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle API errors in setLibraryData', async () => {
      server.use(
        http.post('/api/library-data', () => {
          return HttpResponse.json({ status: 'error', message: 'Server error' }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useLibraryData())
      const file = new File([JSON.stringify(mockLibraryData)], 'library.json', {
        type: 'application/json',
      })

      await expect(result.current.setLibraryData(file)).rejects.toThrow('Server error')
    })
  })

  describe('memoization and re-renders', () => {
    it('should memoize getLibraryData function', () => {
      const { result, rerender } = renderHook(() => useLibraryData())

      const firstRender = result.current.getLibraryData
      rerender()
      const secondRender = result.current.getLibraryData

      expect(firstRender).toBe(secondRender)
    })

    it('should not cause infinite re-renders', async () => {
      let callCount = 0

      server.use(
        http.get('/data/libraryData.json', () => {
          callCount++
          return HttpResponse.json(mockLibraryData)
        })
      )

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Check that fetch was called only once (on initial mount)
      expect(callCount).toBe(1)
    })

    it('should update when sort method changes', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result, rerender } = renderHook(
        ({ releaseSort }) => useLibraryData({ enabled: true, releaseSort }),
        { initialProps: { releaseSort: 'asc' as const } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialReleases = result.current.releases

      // Change sort method
      rerender({ releaseSort: 'desc' as const })

      await waitFor(() => {
        expect(result.current.releases).not.toEqual(initialReleases)
      })
    })

    it('should preserve state across re-renders', async () => {
      // Uses default MSW handler for /data/libraryData.json

      const { result, rerender } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        expect(result.current.releases).not.toBeNull()
      })

      const releases = result.current.releases

      rerender()

      expect(result.current.releases).toBe(releases)
    })
  })
})
