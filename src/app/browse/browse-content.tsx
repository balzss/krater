'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { MusicTile, SearchInput, ClearableTag, PageHeader } from '@/components'
import { useLibraryData } from '@/hooks'
import { CONFIG } from '@/lib/constants'

export default function BrowsePageContent() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { releases, artists } = useLibraryData({ enabled: true })

  const searchParams = useSearchParams()
  const artistParam = searchParams.get('artist')

  // Create artist lookup map for O(1) lookups
  const artistMap = useMemo(() => new Map(artists?.map((a) => [a.rymId, a]) || []), [artists])

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
        .map((id) => artistMap.get(id)?.displayName.toLowerCase())
        .join(' ')
      return (
        releaseArtists.includes(lowerSearchQuery) ||
        r.title.toLowerCase().includes(lowerSearchQuery)
      )
    })
  }, [releases, artists, artistParam, searchQuery, artistMap])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <PageHeader
        actions={
          <SearchInput
            query={searchQuery}
            onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
            placeholder="Search releases"
            className="max-w-lg"
          />
        }
      />
      {artists && artistParam && (
        <div className="flex justify-start w-full mt-4 sm:mt-8">
          <ClearableTag
            href="/browse"
            tagLabel="Artist"
            tagValue={artistMap.get(artistParam)?.displayName as string}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 w-full justify-items-center m-4 sm:m-12">
        {artists &&
          filteredReleases.map(({ artistRymIds, title, rymId, cover, media }, index) => (
            <MusicTile
              key={rymId}
              cover={cover}
              artists={artistRymIds.map((id) => artistMap.get(id))}
              title={title}
              media={media.spotify}
              priority={index < CONFIG.images.priorityLoadCount}
            />
          ))}
      </div>
    </div>
  )
}
