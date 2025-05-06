import { useState, useEffect, useCallback } from 'react'

type ThemeSetting = 'light' | 'dark'
const THEME_STORAGE_KEY = 'color-theme'
const isClient = typeof window !== 'undefined'

// Gets the system theme preference (used only for initial default)
const getSystemThemeDefault = (): ThemeSetting => {
  if (!isClient) return 'light' // Sensible SSR default, will be corrected on client
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Applies 'light' or 'dark' class to the HTML element
const applyThemeClass = (theme: ThemeSetting) => {
  if (!isClient) return
  if (theme !== 'light' && theme !== 'dark') return // Basic validation
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
}

// --- Hook Return Type ---
interface UseThemeReturn {
  theme: ThemeSetting | null // 'light', 'dark', or null initially
  setTheme: (theme: ThemeSetting) => void // Accepts only 'light' or 'dark'
}

// --- Hook Implementation ---
export function useTheme(): UseThemeReturn {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting | null>(() => {
    if (!isClient) return null // Defer determination to client-side run

    // 1. Check localStorage first
    try {
      const storedSetting = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeSetting | null
      // Use stored value only if it's explicitly 'light' or 'dark'
      if (storedSetting === 'light' || storedSetting === 'dark') {
        return storedSetting
      }
    } catch (_e) {
      // Ignore localStorage errors, proceed to system check below
    }

    // 2. If no valid stored setting, THEN use system preference as the default
    return getSystemThemeDefault()
  })

  // Effect: Apply theme class whenever themeSetting changes (and is not null)
  // This runs once themeSetting is determined on client, applying the initial theme
  useEffect(() => {
    if (themeSetting) {
      applyThemeClass(themeSetting)
    }
  }, [themeSetting])

  // Exposed theme setter (Accepts only 'light' or 'dark')
  const setTheme = useCallback((newSetting: ThemeSetting) => {
    // Basic validation for input
    if (newSetting !== 'light' && newSetting !== 'dark') {
      console.warn(`Invalid theme value passed to setTheme: ${newSetting}`)
      return
    }
    try {
      if (isClient) window.localStorage.setItem(THEME_STORAGE_KEY, newSetting)
    } catch (_e) {
      // Ignore localStorage errors
    }
    // Update state; the effect will handle applying the class
    // No need to listen for system changes anymore
    setThemeSetting(newSetting)
  }, [])

  return {
    theme: themeSetting,
    setTheme,
  }
}
