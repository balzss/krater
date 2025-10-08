import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useHealthCheck } from '@/hooks/use-health-check'
import { server } from '../../../../vitest.setup'
import { http, HttpResponse } from 'msw'

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  const mockHealthData = {
    unusedCovers: ['unused1.jpg', 'unused2.jpg'],
    unusedArtists: [{ rymId: 'unused-artist', displayName: 'Unused Artist' }],
    missingCovers: [],
    missingArtists: [],
  }

  it('should fetch health data on mount', async () => {
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.json({ issues: mockHealthData })
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
        expect(result.current.healthData).toEqual(mockHealthData)
      },
      { timeout: 3000 }
    )
  })

  it('should set loading state during fetch', async () => {
    server.use(
      http.get('/api/health', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ issues: mockHealthData })
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    // Initially loading
    expect(result.current.loading).toBe(true)

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 3000 }
    )
  })

  it('should handle successful health check', async () => {
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.json({ issues: mockHealthData })
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(
      () => {
        expect(result.current.healthData).toEqual(mockHealthData)
        expect(result.current.error).toBeNull()
      },
      { timeout: 3000 }
    )
  })

  it('should handle failed health check', async () => {
    server.use(
      http.get('/api/health', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.error?.message).toContain('HTTP error')
      },
      { timeout: 3000 }
    )
  })

  it('should set error state on failure', async () => {
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.loading).toBe(false)
      },
      { timeout: 3000 }
    )
  })

  it('should allow manual refetch via refetchHealthData', async () => {
    let callCount = 0

    server.use(
      http.get('/api/health', () => {
        callCount++
        return HttpResponse.json({ issues: mockHealthData })
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 3000 }
    )

    const initialCallCount = callCount

    // Manual refetch
    await result.current.refetchHealthData()

    await waitFor(
      () => {
        expect(callCount).toBe(initialCallCount + 1)
      },
      { timeout: 3000 }
    )
  })

  it('should reset error state on successful refetch', async () => {
    let callCount = 0

    server.use(
      http.get('/api/health', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json({ issues: mockHealthData })
      })
    )

    const { result } = renderHook(() => useHealthCheck())

    // Wait for initial error
    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull()
      },
      { timeout: 3000 }
    )

    // Refetch should succeed
    await result.current.refetchHealthData()

    await waitFor(
      () => {
        expect(result.current.error).toBeNull()
        expect(result.current.healthData).toEqual(mockHealthData)
      },
      { timeout: 3000 }
    )
  })

  it('should cleanup on unmount', async () => {
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.json({ issues: mockHealthData })
      })
    )

    const { result, unmount } = renderHook(() => useHealthCheck())

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 3000 }
    )

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow()
  })
})
