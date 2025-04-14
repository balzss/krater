'use client'

import { useState, useEffect } from 'react'
import { House } from 'lucide-react'
import { SearchInput, MenuItem } from '@/components'
import { type Artist } from '@/lib/data'
import { useFetchJson } from '@/hooks'

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [artistResults, setArtistResults] = useState<Artist[]>([])
  const {
    data: artists,
    loading: _artistsLoading,
    error: _artistsError,
  } = useFetchJson<Artist[]>('/krater/data/artists.json')

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
      <div className="flex items-center w-full max-w-md gap-4 sm:gap-6 sm:mb-4">
        <SearchInput
          query={searchQuery}
          onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
        />
        <a href="/krater" className="flex justify-center items-center text-(--icon)">
          <House size={40} />
        </a>
      </div>
      {artistResults.map((artist) => (
        <MenuItem key={artist.rymId} href={`/krater/browse?a=${artist.rymId}`} className="max-w-md">
          {artist.displayName}
        </MenuItem>
      ))}
    </div>
  )
}
