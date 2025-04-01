'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { releases, artists, Release } from '@/lib/data'
import { MusicTile, SearchInput, ClearableTag } from '@/components'

function BrowsePageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [releaseResults, setReleaseResults] = useState<Release[]>([])

  const artistParam = searchParams.get('a')
  const releasesToList = artistParam
    ? releases.filter((r) => r.artistRymIds.includes(artistParam))
    : releases

  useEffect(() => {
    if (!searchQuery) {
      setReleaseResults(releasesToList.sort(() => Math.random() - 0.5))
      return
    }
    const lowerSearchQuery = searchQuery.toLowerCase()
    const filteredResults = releasesToList.filter((r) => {
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
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <SearchInput
        query={searchQuery}
        onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
      />
      {artistParam && (
        <div className="flex justify-start w-full mt-4 sm:mt-8">
          <ClearableTag
            href="/krater/browse"
            tagLabel="Artist"
            tagValue={artists.find((a) => a.rymId === artistParam)?.displayName as string}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 w-full justify-items-center m-4 sm:m-12">
        {releaseResults.map(({ artistRymIds, title, rymId, cover, media }) => (
          <MusicTile
            key={rymId}
            cover={cover}
            artists={artistRymIds.map((id) => artists.find((artist) => artist.rymId === id))}
            title={title}
            media={media.spotify}
          />
        ))}
      </div>
    </div>
  )
}
export default function BrowsePage() {
  return (
    <Suspense>
      <BrowsePageContent />
    </Suspense>
  )
}
