'use client'

import { Library, User, Dices, Settings } from 'lucide-react'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { ActionButton, MenuItem } from '@/components'
import { useLibraryData } from '@/hooks'

export function MainPageContent() {
  const appVersion = process.env.APP_VERSION
  const { releases, artists, isLoading } = useLibraryData({ enabled: true })

  if (isLoading) {
    return
  }

  return (
    <div className="flex items-center flex-col p-4 sm:py-12 sm:px-16 min-h-screen">
      <div className="flex items-center flex-col gap-4 sm:gap-6 max-w-lg w-full">
        <div className="flex w-full gap-2 sm:gap-4 items-center">
          <h1 className="text-4xl font-bold mr-auto">Krater</h1>
          <ActionButton href="https://github.com/balzss/krater" target="_blank" icon={SiGithub} />
          <ActionButton href="/settings" icon={Settings} />
        </div>

        <MenuItem startIcon={Library} href="/browse">
          Browse {releases?.length} releases
        </MenuItem>

        <MenuItem startIcon={User} href="/artists">
          View {artists?.length} artists
        </MenuItem>

        <MenuItem startIcon={Dices} href="/random">
          Get a random suggestion
        </MenuItem>
      </div>
      <div className="text-center mt-auto pt-4 opacity-70 font-mono text-sm">v{appVersion}</div>
    </div>
  )
}
