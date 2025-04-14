'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Library, User, Dices, Github, ExternalLink, Wrench, Loader, Sun, Moon } from 'lucide-react'
import type { Release, Artist } from '@/lib/data'
import { MenuItem } from '@/components'
import { useFetchJson } from '@/hooks'

export function MainPageContent() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true'
  const {
    data: releases,
    loading: releasesLoading,
    error: _releasesError,
  } = useFetchJson<Release[]>('/krater/data/releases.json')
  const {
    data: artists,
    loading: artistsLoading,
    error: _artistsError,
  } = useFetchJson<Artist[]>('/krater/data/artists.json')

  const handleSwitchTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="flex items-center flex-col gap-4 sm:gap-8 max-w-md w-full">
        {theme && (
          <MenuItem startIcon={theme === 'dark' ? Sun : Moon} onClick={handleSwitchTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </MenuItem>
        )}

        <MenuItem
          startIcon={Github}
          endIcon={ExternalLink}
          href="https://github.com/balzss/krater"
          target="_blank"
        >
          Github repo
        </MenuItem>

        {isLocalhost && (
          <MenuItem startIcon={Wrench} href="/krater/manage">
            Manage library
          </MenuItem>
        )}

        <MenuItem startIcon={artistsLoading ? Loader : User} href="/krater/artists">
          {!artistsLoading && `View ${artists?.length} artists`}
        </MenuItem>

        <MenuItem startIcon={releasesLoading ? Loader : Library} href="/krater/browse">
          {!releasesLoading && `Browse all ${releases?.length || 0} releases`}
        </MenuItem>

        <MenuItem startIcon={Dices} href="/krater/random">
          Get a random suggestion
        </MenuItem>
      </div>
    </div>
  )
}
