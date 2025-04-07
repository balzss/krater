'use client'

import { Library, User, Dices, Github, ExternalLink, Wrench, Loader } from 'lucide-react'
import { type Release, artists } from '@/lib/data'
import { MenuItem } from '@/components'
import { useFetchJson } from '@/hooks'

export function MainPageContent() {
  const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true'
  const {
    data: releases,
    loading: releasesLoading,
    error: _releasesError,
  } = useFetchJson<Release[]>('/krater/data/releases.json')

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-8">
      <MenuItem startIcon={releasesLoading ? Loader : Library} href="/krater/browse">
        {!releasesLoading && `Browse all ${releases?.length || 0} releases`}
      </MenuItem>

      <MenuItem startIcon={User} href="/krater/artists">
        View {artists.length} artists
      </MenuItem>

      <MenuItem startIcon={Dices} href="/krater/random">
        Get a random suggestion
      </MenuItem>

      {isLocalhost && (
        <MenuItem startIcon={Wrench} href="/krater/manage">
          Manage library
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
    </div>
  )
}
