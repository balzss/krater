import { useState, useEffect } from 'react'

interface UseFetchJsonReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

type HookOptions = {
  sort?: 'asc' | 'desc' | 'random'
  sortKey?: string
}

function useFetchJson<T>(filePath: string, options: HookOptions = {}): UseFetchJsonReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const { sort, sortKey } = options
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      // Optionally clear previous data: setData(null);

      try {
        const response = await fetch(filePath, { signal })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`Received non-JSON content type: ${contentType} from ${filePath}`)
          throw new TypeError('Received non-JSON response')
        }

        const jsonData = await response.json()
        let sortedData
        const dataToSort = [...jsonData] as T

        if (!sort || !sortKey || !Array.isArray(dataToSort)) {
          setData(jsonData)
          return
        }
        switch (sort) {
          case 'asc':
            sortedData = dataToSort.sort((a, b) => a[sortKey].localeCompare(String(b[sortKey!])))
            break
          case 'desc':
            sortedData = dataToSort.sort((a, b) => b[sortKey].localeCompare(a[sortKey]))
            break
          case 'random':
            sortedData = dataToSort.sort(() => Math.random() - 0.5)
            break
          default:
            sortedData = dataToSort
        }
        setData(sortedData)
      } catch (err) {
        if (err instanceof Error) {
          // Type guard for error
          if (err.name === 'AbortError') {
            console.log('Fetch aborted')
          } else {
            console.error('Failed to fetch JSON:', err)
            setError(err)
          }
        } else {
          // Handle cases where the caught object is not an Error instance
          console.error('An unknown error occurred during fetch:', err)
          setError(new Error('An unknown error occurred'))
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      controller.abort()
      setLoading(false)
    }
  }, [filePath, sort, sortKey])

  return { data, loading, error }
}

export { useFetchJson }
