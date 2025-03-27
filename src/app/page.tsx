'use client'

import { useState, useEffect } from 'react'
import { releases, artists, Release } from '@/lib/data'
import { MusicTile, SearchInput } from '@/components'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [releaseResults, setReleaseResults] = useState<Release[]>([])

  useEffect(() => {
    if (!searchQuery) {
      setReleaseResults(releases.sort(() => Math.random() - 0.5))
      return
    }
    const lowerSearchQuery = searchQuery.toLowerCase()
    const filteredResults = releases.filter((r) => {
      const releaseArtists = r.artistRymIds
        .map((id) => artists.find((artist) => artist.rymId === id)?.displayName.toLowerCase())
        .join(' ')
      return (
        releaseArtists.includes(lowerSearchQuery) ||
        r.title.toLowerCase().includes(lowerSearchQuery)
      )
    })
    setReleaseResults(filteredResults)
  }, [searchQuery])

  return (
    <div className="min-h-screen flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <SearchInput
        query={searchQuery}
        onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 w-full justify-items-center m-4 sm:m-12">
        {releaseResults.map(({ artistRymIds, title, rymId, cover, media }) => (
          <MusicTile
            key={rymId}
            cover={cover}
            artists={artistRymIds.map(
              (id) => artists.find((artist) => artist.rymId === id)?.displayName as string
            )}
            title={title}
            media={media.spotify}
          />
        ))}
      </div>
    </div>
  )
}
