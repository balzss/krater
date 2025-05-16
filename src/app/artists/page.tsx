'use client'

import { useState, useEffect } from 'react'
import { House } from 'lucide-react'
import { SearchInput, MenuItem, ActionButton } from '@/components'
import { useLibraryData } from '@/hooks'
import type { Artist } from '@/lib/data'

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [artistResults, setArtistResults] = useState<Artist[]>([])
  const { artists } = useLibraryData({ enabled: true })

  useEffect(() => {
    document.title = 'Artists | Krater'
  }, [])

  useEffect(() => {
    if (!artists) return
    if (!searchQuery) {
      setArtistResults(artists)
      return
    }
    const lowerSearchQuery = searchQuery.toLowerCase()
    const filteredResults = artists.filter((artist) =>
      artist.displayName.toLowerCase().includes(lowerSearchQuery)
    )
    setArtistResults(filteredResults)
  }, [searchQuery, artists])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4">
      <div className="flex items-center w-full max-w-lg gap-2 sm:gap-4 sm:mb-4">
        <SearchInput
          query={searchQuery}
          onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
          placeholder="Search artists"
        />
        <ActionButton href="/" icon={House} />
      </div>
      {artistResults.map((artist) => (
        <MenuItem key={artist.rymId} href={`/browse?artist=${artist.rymId}`} className="max-w-lg">
          {artist.displayName}
        </MenuItem>
      ))}
    </div>
  )
}
