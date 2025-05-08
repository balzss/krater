import { useState, useEffect, useCallback } from 'react'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const apiUrl = `${basePath}/api/auth`

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loginError, setLoginError] = useState('')

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/me`)
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(data.isAdmin || false)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error(error)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const login = useCallback(async (secret: string) => {
    setLoginError('')
    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      if (res.ok) {
        setIsAdmin(true)
        return true
      } else {
        const errorData = await res.json()
        setLoginError(errorData.message || 'Login failed. Invalid secret.')
        setIsAdmin(false)
        return false
      }
    } catch (error) {
      console.error(error)
      setLoginError('An error occurred during login.')
      setIsAdmin(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetch(`${apiUrl}/logout`, { method: 'POST' })
      setIsAdmin(false)
      setLoginError('')
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isAdmin,
    isLoading,
    loginError,
    login,
    logout,
  }
}
