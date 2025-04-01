'use client'

import { useState, useEffect } from 'react'
import { House } from 'lucide-react'
import { SearchInput } from '@/components'
import { artists, type Artist } from '@/lib/data'

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [artistResults, setArtistResults] = useState<Artist[]>([])

  useEffect(() => {
    document.title = 'Artists | Krater'
  }, [])

  useEffect(() => {
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
  }, [searchQuery])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4">
      <div className="flex items-center w-full max-w-md gap-4 sm:gap-6 sm:mb-4">
        <a
          href="/krater"
          className="h-8 w-8 flex justify-center items-center text-gray-300 hover:text-gray-400"
        >
          <House size={32} />
        </a>
        <SearchInput
          query={searchQuery}
          onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
        />
      </div>
      {artistResults.map((artist) => (
        <a
          key={artist.rymId}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-md cursor-pointer duration-300 transform transition hover:scale-103 ease-in-out flex gap-2 items-center"
          href={`/krater/browse?a=${artist.rymId}`}
        >
          {artist.displayName}
        </a>
      ))}
    </div>
  )
}
