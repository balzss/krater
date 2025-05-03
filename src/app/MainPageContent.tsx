'use client'

import { useState, useEffect } from 'react'
import { Library, User, Dices, Github, ExternalLink, Settings, Loader } from 'lucide-react'
import type { Release, Artist } from '@/lib/data'
import { MenuItem } from '@/components'
import { useFetchJson } from '@/hooks'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function MainPageContent() {
  const [mounted, setMounted] = useState(false)

  const {
    data: releases,
    loading: releasesLoading,
    error: _releasesError,
  } = useFetchJson<Release[]>(`${basePath}/data/releases.json`)
  const {
    data: artists,
    loading: artistsLoading,
    error: _artistsError,
  } = useFetchJson<Artist[]>(`${basePath}/data/artists.json`)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="flex items-center flex-col gap-4 sm:gap-6 max-w-md w-full">
        <MenuItem
          startIcon={Github}
          endIcon={ExternalLink}
          href="https://github.com/balzss/krater"
          target="_blank"
        >
          Github repo
        </MenuItem>

        <MenuItem startIcon={Settings} href={`/settings`}>
          Settings
        </MenuItem>

        <MenuItem startIcon={artistsLoading ? Loader : User} href="/artists">
          {!artistsLoading && `View ${artists?.length} artists`}
        </MenuItem>

        <MenuItem startIcon={releasesLoading ? Loader : Library} href="/browse">
          {!releasesLoading && `Browse all ${releases?.length || 0} releases`}
        </MenuItem>

        <MenuItem startIcon={Dices} href="/random">
          Get a random suggestion
        </MenuItem>
      </div>
    </div>
  )
}
