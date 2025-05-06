'use client'

import { Library, User, Dices, Github, ExternalLink, Settings, LoaderCircle } from 'lucide-react'
import { MenuItem } from '@/components'
import { useLibraryData } from '@/hooks'

export function MainPageContent() {
  const { releases, artists, isLoading } = useLibraryData({ enabled: true })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center m-4 sm:my-12 gap-2">
        <LoaderCircle size={20} className="animate-spin" /> Fetching data...
      </div>
    )
  }

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="flex items-center flex-col gap-4 sm:gap-6 max-w-md w-full">
        <MenuItem
          startIcon={Github}
          endIcon={ExternalLink}
          href="https://github.com/balzss/krater"
          target="_blank"
        >
          Github repository
        </MenuItem>

        <MenuItem startIcon={Settings} href={`/settings`}>
          Settings
        </MenuItem>

        <MenuItem startIcon={User} href="/artists">
          View {artists?.length} artists
        </MenuItem>

        <MenuItem startIcon={Library} href="/browse">
          Browse all {releases?.length} releases
        </MenuItem>

        <MenuItem startIcon={Dices} href="/random">
          Get a random suggestion
        </MenuItem>
      </div>
    </div>
  )
}
