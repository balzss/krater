'use client'

import { useState, useEffect } from 'react'
import { House } from 'lucide-react'
import { SearchInput, MenuItem, ActionButton } from '@/components'
import { type Artist } from '@/lib/data'
import { useFetchJson } from '@/hooks'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [artistResults, setArtistResults] = useState<Artist[]>([])
  const {
    data: artists,
    loading: _artistsLoading,
    error: _artistsError,
  } = useFetchJson<Artist[]>(`${basePath}/data/artists.json`)

  useEffect(() => {
    document.title = 'Artists | Krater'
  }, [])

  useEffect(() => {
    if (!artists) return
    if (!searchQuery) {
      setArtistResults(
        artists.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
        )
      )
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
      <div className="flex items-center w-full max-w-md gap-2 sm:gap-4 sm:mb-4">
        <SearchInput
          query={searchQuery}
          onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
        />
        <ActionButton href="/" size={40} icon={House} />
      </div>
      {artistResults.map((artist) => (
        <MenuItem key={artist.rymId} href={`/browse?a=${artist.rymId}`} className="max-w-md">
          {artist.displayName}
        </MenuItem>
      ))}
    </div>
  )
}
