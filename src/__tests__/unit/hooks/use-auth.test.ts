import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth } from '@/hooks/use-auth'
import { server } from '../../../../vitest.setup'
import { http, HttpResponse } from 'msw'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should check auth status on mount', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: true })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isAdmin).toBe(true)
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )
  })

  it('should set loading state during auth check', async () => {
    server.use(
      http.get('/api/auth/me', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ isAdmin: false })
      })
    )

    const { result } = renderHook(() => useAuth())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )
  })

  it('should login successfully with valid secret', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: false })
      }),
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json()
        if (body.secret === 'valid-secret') {
          return HttpResponse.json({ success: true })
        }
        return HttpResponse.json({ message: 'Invalid' }, { status: 401 })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    await result.current.login('valid-secret')

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true)
    })
  })

  it('should fail login with invalid secret', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: false })
      }),
      http.post('/api/auth/login', () => {
        return HttpResponse.json({ message: 'Invalid secret' }, { status: 401 })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    await result.current.login('invalid-secret')

    await waitFor(() => {
      expect(result.current.loginError).toBe('Invalid secret')
      expect(result.current.isAdmin).toBe(false)
    })
  })

  it('should set error message on failed login', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: false })
      }),
      http.post('/api/auth/login', () => {
        return HttpResponse.json({ message: 'Authentication failed' }, { status: 401 })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    await result.current.login('wrong-secret')

    await waitFor(() => {
      expect(result.current.loginError).toBe('Authentication failed')
    })
  })

  it('should clear error message on successful login', async () => {
    let loginAttempts = 0

    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: false })
      }),
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json()
        loginAttempts++

        if (loginAttempts === 1) {
          // First attempt fails
          return HttpResponse.json({ message: 'Invalid secret' }, { status: 401 })
        } else {
          // Second attempt succeeds
          return HttpResponse.json({ success: true })
        }
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    // First login fails
    await result.current.login('wrong-secret')

    await waitFor(() => {
      expect(result.current.loginError).toBe('Invalid secret')
    })

    // Second login succeeds
    await result.current.login('correct-secret')

    await waitFor(() => {
      expect(result.current.loginError).toBe('')
      expect(result.current.isAdmin).toBe(true)
    })
  })

  it('should logout successfully', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: true })
      }),
      http.post('/api/auth/logout', () => {
        return HttpResponse.json({ message: 'Logout successful' })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isAdmin).toBe(true)
      },
      { timeout: 3000 }
    )

    await result.current.logout()

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false)
    })
  })

  it('should clear admin state after logout', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: true })
      }),
      http.post('/api/auth/logout', () => {
        return HttpResponse.json({ message: 'Logout successful' })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isAdmin).toBe(true)
      },
      { timeout: 3000 }
    )

    await result.current.logout()

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.loginError).toBe('')
    })
  })

  it('should handle network errors during login', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: false })
      }),
      http.post('/api/auth/login', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    await result.current.login('test-secret')

    await waitFor(() => {
      expect(result.current.loginError).toBe('An error occurred during login.')
      expect(result.current.isAdmin).toBe(false)
    })
  })

  it('should handle network errors during logout', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ isAdmin: true })
      }),
      http.post('/api/auth/logout', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isAdmin).toBe(true)
      },
      { timeout: 3000 }
    )

    // Should not throw
    await expect(result.current.logout()).resolves.toBeUndefined()

    // When logout fails, admin state should remain true (as per implementation)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAdmin).toBe(true)
  })

  it('should handle network errors during auth check', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isAdmin).toBe(false)
      },
      { timeout: 3000 }
    )
  })

  it('should not refetch auth on every render', async () => {
    let callCount = 0

    server.use(
      http.get('/api/auth/me', () => {
        callCount++
        return HttpResponse.json({ isAdmin: false })
      })
    )

    const { result, rerender } = renderHook(() => useAuth())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    const initialCallCount = callCount

    // Re-render multiple times
    rerender()
    rerender()
    rerender()

    // Should not make additional auth check calls
    expect(callCount).toBe(initialCallCount)
  })
})
