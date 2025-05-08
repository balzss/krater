import { useState, useEffect, useCallback } from 'react'
import { HealthIssues } from '@/lib/server'

const initialHealthData: HealthIssues = {
  unusedCovers: [],
  unusedArtists: [],
  missingCovers: [],
  missingArtists: [],
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const apiUrl = `${basePath}/api/health`

export const useHealthCheck = () => {
  const [healthData, setHealthData] = useState<HealthIssues>(initialHealthData)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchHealthData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const responseData = await response.json()
      const issues = responseData?.issues

      setHealthData({
        unusedCovers: issues?.unusedCovers || [],
        unusedArtists: issues?.unusedArtists || [],
        missingCovers: issues?.missingCovers || [],
        missingArtists: issues?.missingArtists || [],
      })
    } catch (e) {
      if (e instanceof Error) {
        setError(e)
      } else {
        setError(new Error('An unknown error occurred'))
      }
      setHealthData(initialHealthData) // Reset to initial state on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealthData()
  }, [fetchHealthData])

  return {
    healthData,
    loading,
    error,
    refetchHealthData: fetchHealthData,
  }
}
