import { useCallback } from 'react'
import { API_BASE_URL } from '@/lib/constants'
import { useAuth } from './use-auth'
import { useLibraryData } from './use-library-data'

export function useRemoveRelease() {
  const { isAdmin } = useAuth()
  const { getLibraryData } = useLibraryData({ enabled: false })

  const removeRelease = useCallback(
    async (rymId: string) => {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const response = await fetch(`${API_BASE_URL}/releases?rymId=${rymId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to remove release' }))
        throw new Error(error.message || 'Failed to remove release')
      }

      // Refresh library data after successful removal
      await getLibraryData()
    },
    [isAdmin, getLibraryData]
  )

  return { removeRelease, isAdmin }
}
