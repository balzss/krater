'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { House } from 'lucide-react'
import { MusicTile, SearchInput, ClearableTag, ActionButton } from '@/components'
import { useLibraryData } from '@/hooks'

export default function BrowsePageContent() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { releases, artists } = useLibraryData({ enabled: true })

  const searchParams = useSearchParams()
  const artistParam = searchParams.get('artist')

  const filteredReleases = useMemo(() => {
    if (!releases || !artists) return []

    const result = artistParam
      ? releases.filter((r) => r.artistRymIds.includes(artistParam))
      : releases

    if (searchQuery.trim() === '') {
      return result.sort(() => Math.random() - 0.5)
    }

    const lowerSearchQuery = searchQuery.toLowerCase()
    return result.filter((r) => {
      const releaseArtists = r.artistRymIds
        .map((id) => artists.find((artist) => artist.rymId === id)?.displayName.toLowerCase())
        .join(' ')
      return (
        releaseArtists.includes(lowerSearchQuery) ||
        r.title.toLowerCase().includes(lowerSearchQuery)
      )
    })
  }, [releases, artistParam, searchQuery, artists])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="flex items-center w-full max-w-lg gap-2 sm:gap-4">
        <SearchInput
          query={searchQuery}
          onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
          placeholder="Search releases"
        />
        <ActionButton href="/" icon={House} />
      </div>
      {artists && artistParam && (
        <div className="flex justify-start w-full mt-4 sm:mt-8">
          <ClearableTag
            href="/browse"
            tagLabel="Artist"
            tagValue={artists.find((a) => a.rymId === artistParam)?.displayName as string}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 w-full justify-items-center m-4 sm:m-12">
        {artists &&
          filteredReleases.map(({ artistRymIds, title, rymId, cover, media }, index) => (
            <MusicTile
              key={rymId}
              cover={cover}
              artists={artistRymIds.map((id) => artists.find((artist) => artist.rymId === id))}
              title={title}
              media={media.spotify}
              priority={index < 8}
            />
          ))}
      </div>
    </div>
  )
}
