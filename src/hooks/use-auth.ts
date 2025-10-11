'use client'

import { useSession, signOut } from '@/lib/auth-client'

/**
 * Hook to manage authentication state using Better Auth
 * Provides session information and auth actions
 */
export function useAuth() {
  const { data: session, isPending, error } = useSession()

  const logout = async () => {
    try {
      await signOut()
      // Optionally redirect to home or login page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    // User and session info
    user: session?.user ?? null,
    session: session ?? null,

    // Auth state
    isAuthenticated: !!session,
    isAdmin: !!session, // All authenticated users are admin in this app
    isLoading: isPending,
    error: error?.message ?? null,

    // Actions
    logout,
  }
}
