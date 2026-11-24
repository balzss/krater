import { useState, useEffect } from 'react'
import type { Release, Artist, LibraryData } from '@/lib/data'
import { DATA_PATH } from '@/lib/constants'

type SortMethod = 'asc' | 'desc' | 'random'

interface UseLibraryDataProps {
  releaseSort?: SortMethod
  artistSort?: SortMethod
}

interface UseLibraryDataReturn {
  releases: Release[] | null
  artists: Artist[] | null
  isLoading: boolean
}

const dataJsonPath = `${DATA_PATH}/libraryData.json`

// One request per page load, shared by every component that asks for the library
let libraryRequest: Promise<LibraryData> | null = null

function fetchLibraryData(): Promise<LibraryData> {
  if (!libraryRequest) {
    libraryRequest = fetch(dataJsonPath)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch library data: ${response.status}`)
        return response.json() as Promise<LibraryData>
      })
      .catch((error) => {
        libraryRequest = null // allow a retry on the next mount
        throw error
      })
  }
  return libraryRequest
}

/** Clears the cached request. Only needed by tests. */
export function resetLibraryCache() {
  libraryRequest = null
}

/**
 * Generic sorting function for arrays with Fisher-Yates shuffle for random sorting
 * @param items - Array of items to sort
 * @param method - Sort method: 'asc', 'desc', or 'random'
 * @param compareFn - Comparison function for 'asc' sorting (result will be inverted for 'desc')
 * @returns Sorted array (new array, original is not mutated)
 */
function sortItems<T>(items: T[], method: SortMethod, compareFn: (a: T, b: T) => number): T[] {
  const sorted = [...items] // avoid param mutation by creating a shallow copy

  if (method === 'asc') {
    return sorted.sort(compareFn)
  } else if (method === 'desc') {
    return sorted.sort((a, b) => compareFn(b, a))
  }

  // Fisher-Yates shuffle for unbiased random sorting
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
  }
  return sorted
}

export function useLibraryData({
  releaseSort = 'random',
  artistSort = 'asc',
}: UseLibraryDataProps = {}): UseLibraryDataReturn {
  const [releases, setReleases] = useState<Release[] | null>(null)
  const [artists, setArtists] = useState<Artist[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    fetchLibraryData()
      .then((library) => {
        if (cancelled) return
        setArtists(
          sortItems(library.artists, artistSort, (a, b) =>
            a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
          )
        )
        setReleases(
          sortItems(library.releases, releaseSort, (a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
          )
        )
      })
      .catch((error) => {
        console.error('Error loading library data:', error)
        if (cancelled) return
        setReleases(null)
        setArtists(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [artistSort, releaseSort])

  return { releases, artists, isLoading }
}
