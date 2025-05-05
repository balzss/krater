import { LibraryData } from '@/lib/data'

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
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const apiUrl = `${basePath}/api/library-data`
const dataJsonPath = `${basePath}/data/data.json`

export function useLibraryData(): UseLibraryDataReturn {
  const getLibraryData = async (): Promise<LibraryData | null> => {
    try {
      const response = await fetch(dataJsonPath)
      if (!response.ok) {
        console.error('Failed to fetch library data:', response.status, response.statusText)
        throw new Error(`API Error: ${response.status}`)
      }
      const libraryData: LibraryData = await response.json()
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

  return { getLibraryData, setLibraryData }
}
