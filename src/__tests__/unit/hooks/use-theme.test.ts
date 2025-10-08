import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTheme } from '@/hooks/use-theme'

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classes
    document.documentElement.className = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should provide theme from localStorage', () => {
    localStorage.setItem('color-theme', 'dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  it('should provide setTheme function', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.setTheme).toBeInstanceOf(Function)
  })

  it('should allow theme switching', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should persist theme preference', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorage.getItem('color-theme')).toBe('dark')

    act(() => {
      result.current.setTheme('light')
    })

    expect(localStorage.getItem('color-theme')).toBe('light')
  })

  it('should handle system theme changes', () => {
    // Mock matchMedia to simulate dark mode preference
    const mockMatchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    vi.stubGlobal('matchMedia', mockMatchMedia)

    const { result } = renderHook(() => useTheme())

    // When no stored preference, should use system preference
    if (!localStorage.getItem('color-theme')) {
      expect(result.current.theme).toBe('dark')
    }

    vi.unstubAllGlobals()
  })
})
