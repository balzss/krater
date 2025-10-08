import { useState, useEffect, useCallback } from 'react'
import { LibraryData, Release, Artist } from '@/lib/data'
import { API_BASE_URL, DATA_PATH } from '@/lib/constants'

interface PostApiResponse {
  status: 'ok' | 'error'
  message?: string
  savedAt?: string
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type !== 'application/json') {
      reject(new Error(`Invalid file type: ${file.type}. Expected application/json.`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error || new Error('Unknown FileReader error'))
    reader.readAsText(file)
  })
}

interface UseLibraryDataReturn {
  getLibraryData: () => Promise<LibraryData | null>
  setLibraryData: (jsonFile: File) => Promise<PostApiResponse>
  releases: Release[] | null
  artists: Artist[] | null
  isLoading: boolean
}

type SortMethod = 'asc' | 'desc' | 'random'

interface UseLibraryDataProps {
  enabled?: boolean
  releaseSort?: SortMethod
  artistSort?: SortMethod
}

const apiUrl = `${API_BASE_URL}/library-data`
const dataJsonPath = `${DATA_PATH}/libraryData.json`

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
  enabled = false,
  releaseSort = 'random',
  artistSort = 'asc',
}: UseLibraryDataProps = {}): UseLibraryDataReturn {
  const [releases, setReleases] = useState<Release[] | null>(null)
  const [artists, setArtists] = useState<Artist[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)

  const getLibraryData = useCallback(async (): Promise<LibraryData | null> => {
    setIsLoading(true)
    try {
      const response = await fetch(dataJsonPath)
      if (!response.ok) {
        console.error('Failed to fetch library data:', response.status, response.statusText)
        throw new Error(`API Error: ${response.status}`)
      }
      const libraryData: LibraryData = await response.json()
      const sortedArtists = sortItems(libraryData.artists, artistSort, (a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
      )
      const sortedReleases = sortItems(libraryData.releases, releaseSort, (a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      )

      setReleases(sortedReleases)
      setArtists(sortedArtists)
      setIsLoading(false)

      return libraryData
    } catch (error) {
      console.error('Error in getLibraryData:', error)
      setReleases(null)
      setArtists(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [artistSort, releaseSort])

  const setLibraryData = useCallback(async (jsonFile: File): Promise<PostApiResponse> => {
    setIsLoading(true)
    try {
      const fileContent = await readFileAsText(jsonFile)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: fileContent,
      })

      const responseData: PostApiResponse = await response.json()

      if (!response.ok || responseData.status === 'error') {
        console.error('Failed to set library data:', response.status, responseData.message)
        throw new Error(responseData.message || `API Error: ${response.status}`)
      }

      console.log('Set library data successful:', responseData)
      return responseData
    } catch (error) {
      console.error('Error in setLibraryData:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) getLibraryData()
  }, [enabled, getLibraryData])

  return { getLibraryData, setLibraryData, releases, artists, isLoading }
}
