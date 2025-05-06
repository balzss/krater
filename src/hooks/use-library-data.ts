import { useState, useEffect } from 'react'
import { LibraryData, Release, Artist } from '@/lib/data'

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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const apiUrl = `${basePath}/api/library-data`
const dataJsonPath = `${basePath}/data/libraryData.json`

function sortArtists(artists: Artist[], sortMethod: SortMethod) {
  if (sortMethod === 'asc') {
    return artists.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
    )
  } else if (sortMethod === 'desc') {
    return artists.sort((a, b) =>
      b.displayName.localeCompare(a.displayName, undefined, { sensitivity: 'base' })
    )
  }
  for (let i = artists.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[artists[i], artists[j]] = [artists[j], artists[i]]
  }
  return artists
}

function sortReleases(releases: Release[], sortMethod: SortMethod) {
  if (sortMethod === 'asc') {
    return releases.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )
  } else if (sortMethod === 'desc') {
    return releases.sort((a, b) =>
      b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
    )
  }
  for (let i = releases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[releases[i], releases[j]] = [releases[j], releases[i]]
  }
  return releases
}

export function useLibraryData({
  enabled = false,
  releaseSort = 'random',
  artistSort = 'asc',
}: UseLibraryDataProps = {}): UseLibraryDataReturn {
  const [releases, setReleases] = useState<Release[] | null>(null)
  const [artists, setArtists] = useState<Artist[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const getLibraryData = async (): Promise<LibraryData | null> => {
    setIsLoading(true)
    try {
      const response = await fetch(dataJsonPath)
      if (!response.ok) {
        console.error('Failed to fetch library data:', response.status, response.statusText)
        throw new Error(`API Error: ${response.status}`)
      }
      const libraryData: LibraryData = await response.json()
      const sortedArtists = sortArtists(libraryData.artists, artistSort)
      const sortedReleases = sortReleases(libraryData.releases, releaseSort)

      setReleases(sortedReleases)
      setArtists(sortedArtists)
      setIsLoading(false)

      return libraryData
    } catch (error) {
      console.error('Error in getLibraryData:', error)
      return null
    }
  }

  const setLibraryData = async (jsonFile: File): Promise<PostApiResponse> => {
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
    }
  }

  useEffect(() => {
    if (enabled) getLibraryData()
    setIsLoading(false)
  }, [enabled])

  return { getLibraryData, setLibraryData, releases, artists, isLoading }
}
