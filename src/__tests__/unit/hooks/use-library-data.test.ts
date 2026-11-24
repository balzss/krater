import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useLibraryData, resetLibraryCache } from '@/hooks/use-library-data'
import { mockLibraryData } from '../../mocks/data'
import { server } from '../../../../vitest.setup'

describe('useLibraryData', () => {
  beforeEach(() => {
    resetLibraryCache()
  })

  it('loads releases and artists', async () => {
    const { result } = renderHook(() => useLibraryData())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.releases).toHaveLength(mockLibraryData.releases.length)
    expect(result.current.artists).toHaveLength(mockLibraryData.artists.length)
  })

  it('sorts artists by name by default', async () => {
    const { result } = renderHook(() => useLibraryData())

    await waitFor(() => expect(result.current.artists).not.toBeNull())

    expect(result.current.artists?.map((a) => a.displayName)).toEqual([
      'Aphex Twin',
      'Nine Inch Nails',
      'Radiohead',
    ])
  })

  it('sorts releases ascending and descending by title', async () => {
    const asc = renderHook(() => useLibraryData({ releaseSort: 'asc' }))
    await waitFor(() => expect(asc.result.current.releases).not.toBeNull())
    const ascTitles = asc.result.current.releases?.map((r) => r.title)

    const desc = renderHook(() => useLibraryData({ releaseSort: 'desc' }))
    await waitFor(() => expect(desc.result.current.releases).not.toBeNull())

    expect(ascTitles).toEqual([...(ascTitles ?? [])].sort((a, b) => a.localeCompare(b)))
    expect(desc.result.current.releases?.map((r) => r.title)).toEqual(
      [...(ascTitles ?? [])].reverse()
    )
  })

  it('keeps every release when shuffling', async () => {
    const { result } = renderHook(() => useLibraryData({ releaseSort: 'random' }))

    await waitFor(() => expect(result.current.releases).not.toBeNull())

    expect(result.current.releases?.map((r) => r.rymId).sort()).toEqual(
      mockLibraryData.releases.map((r) => r.rymId).sort()
    )
  })

  it('requests the data file once for several consumers', async () => {
    let requests = 0
    server.use(
      http.get('/data/libraryData.json', () => {
        requests++
        return HttpResponse.json(mockLibraryData)
      })
    )

    const first = renderHook(() => useLibraryData())
    const second = renderHook(() => useLibraryData())

    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))

    expect(requests).toBe(1)
  })

  it('returns null data when the request fails', async () => {
    server.use(http.get('/data/libraryData.json', () => HttpResponse.error()))

    const { result } = renderHook(() => useLibraryData())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.releases).toBeNull()
    expect(result.current.artists).toBeNull()
  })

  it('returns null data on an HTTP error status', async () => {
    server.use(http.get('/data/libraryData.json', () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useLibraryData())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.releases).toBeNull()
  })

  it('retries on the next mount after a failure', async () => {
    server.use(http.get('/data/libraryData.json', () => HttpResponse.error(), { once: true }))

    const failed = renderHook(() => useLibraryData())
    await waitFor(() => expect(failed.result.current.isLoading).toBe(false))
    expect(failed.result.current.releases).toBeNull()

    const retried = renderHook(() => useLibraryData())
    await waitFor(() => expect(retried.result.current.releases).not.toBeNull())
  })
})
