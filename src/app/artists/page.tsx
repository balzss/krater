'use client'

import { useEffect, useCallback } from 'react'
import { SearchInput, MenuItem, PageHeader } from '@/components'
import { useLibraryData, useSearch } from '@/hooks'

export default function ArtistsPage() {
  const { artists } = useLibraryData({ enabled: true })

  // Generic search hook with artist filtering logic
  const filterArtists = useCallback(
    (artist: { displayName: string }, lowerQuery: string) =>
      artist.displayName.toLowerCase().includes(lowerQuery),
    []
  )
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: artistResults,
  } = useSearch(artists, filterArtists)

  useEffect(() => {
    document.title = 'Artists | Krater'
  }, [])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4">
      <PageHeader
        centered
        actions={
          <SearchInput
            query={searchQuery}
            onQueryChange={setSearchQuery}
            placeholder="Search artists"
            className="max-w-lg"
          />
        }
      />
      {artistResults.map((artist) => (
        <MenuItem
          key={artist.rymId}
          href={`/browse?artist=${artist.rymId}`}
          className="max-w-lg"
          data-testid="artist-item"
        >
          {artist.displayName}
        </MenuItem>
      ))}
    </div>
  )
}
