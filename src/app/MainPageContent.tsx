'use client'

import { Library, User, Dices, Settings, LoaderCircle } from 'lucide-react'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { ActionButton, MenuItem } from '@/components'
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
    <div className="flex items-center flex-col p-4 sm:py-12 sm:px-16">
      <div className="flex items-center flex-col gap-4 sm:gap-6 max-w-md w-full">
        <div className="flex w-full gap-2 sm:gap-4">
          <h1 className="text-4xl font-bold mr-auto">Krater</h1>
          <ActionButton href="/settings" icon={Settings} />
          <ActionButton href="https://github.com/balzss/krater" target="_blank" icon={SiGithub} />
        </div>

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
