'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type LayoutMode = 'standard' | 'compact'

interface LayoutContextType {
  layout: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void
  toggleLayout: () => void
  isLoaded: boolean
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

const LAYOUT_STORAGE_KEY = 'krater-layout'

export function LayoutProvider({ children }: { children: ReactNode }) {
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

  return (
    <LayoutContext.Provider value={{ layout, setLayoutMode, toggleLayout, isLoaded }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayoutContext() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within LayoutProvider')
  }
  return context
}
