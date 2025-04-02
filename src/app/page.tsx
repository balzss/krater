import getConfig from 'next/config'
import { type Metadata } from 'next'
import { Library, User, Dices, Github, ExternalLink, Wrench } from 'lucide-react'
import { releases, artists } from '@/lib/data'
import { MenuItem } from '@/components'

export const metadata: Metadata = {
  title: 'Home | Krater',
}

export default function Home() {
  const { publicRuntimeConfig } = getConfig() || {}
  const isStatic = publicRuntimeConfig?.isStaticExport

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-8">
      <MenuItem startIcon={Library} href="/krater/browse">
        Browse all {releases.length} releases
      </MenuItem>

      <MenuItem startIcon={User} href="/krater/artists">
        View {artists.length} artists
      </MenuItem>

      <MenuItem startIcon={Dices} href="/krater/random">
        Get a random suggestion
      </MenuItem>

      {!isStatic && (
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
