import { useState, useEffect, useCallback } from 'react'

type LayoutMode = 'standard' | 'compact'

const LAYOUT_STORAGE_KEY = 'krater-layout'

export function useLayout() {
  const [layout, setLayoutState] = useState<LayoutMode>('standard')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (stored === 'compact' || stored === 'standard') {
        setLayoutState(stored)
      }
      setIsLoaded(true)
    }
  }, [])

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutState(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, mode)
    }
  }, [])

  const toggleLayout = useCallback(() => {
    setLayoutMode(layout === 'standard' ? 'compact' : 'standard')
  }, [layout, setLayoutMode])

  return { layout, setLayoutMode, toggleLayout, isLoaded }
}
