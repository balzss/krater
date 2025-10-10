'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MusicTile, SearchInput, ClearableTag, PageHeader } from '@/components'
import { useLibraryData, useLayout } from '@/hooks'
import { CONFIG } from '@/lib/constants'
import type { Release } from '@/lib/data'

export default function BrowsePageContent() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [shuffledReleases, setShuffledReleases] = useState<Release[]>([])
  const { releases, artists } = useLibraryData({ enabled: true })
  const { layout, isLoaded } = useLayout()

  const searchParams = useSearchParams()
  const artistParam = searchParams.get('artist')

  const isCompact = isLoaded && layout === 'compact'
  const layoutConfig = CONFIG.layout[layout]

  // Shuffle releases only once when data loads (not on every search)
  useEffect(() => {
    if (releases && !artistParam) {
      setShuffledReleases([...releases].sort(() => Math.random() - 0.5))
    } else if (releases && artistParam) {
      // Don't shuffle when filtering by artist
      setShuffledReleases(releases)
    }
  }, [releases, artistParam])

  // Create artist lookup map for O(1) lookups
  const artistMap = useMemo(() => new Map(artists?.map((a) => [a.rymId, a]) || []), [artists])

  const filteredReleases = useMemo(() => {
    if (!shuffledReleases.length || !artists) return []

    // Use shuffled releases as base, or filter by artist if specified
    let result = artistParam
      ? shuffledReleases.filter((r) => r.artistRymIds.includes(artistParam))
      : shuffledReleases

    // Apply search filter only if query exists
    if (searchQuery.trim() !== '') {
      const lowerSearchQuery = searchQuery.toLowerCase()
      result = result.filter((r) => {
        // Check title first (cheaper operation)
        if (r.title.toLowerCase().includes(lowerSearchQuery)) {
          return true
        }

        // Only check artist names if title doesn't match (early return optimization)
        return r.artistRymIds.some((id) => {
          const artist = artistMap.get(id)
          return artist?.displayName.toLowerCase().includes(lowerSearchQuery)
        })
      })
    }

    return result
  }, [shuffledReleases, artists, artistParam, searchQuery, artistMap])

  // Prevent hydration mismatch by not rendering layout-dependent content until loaded
  const contentOpacity = isLoaded ? 'opacity-100' : 'opacity-0'

  return (
    <div
      className={`flex items-center flex-col transition-opacity duration-150 ${contentOpacity} ${isCompact ? 'm-2 sm:m-6' : 'm-4 sm:my-12 sm:mx-16'}`}
    >
      <div className="w-full">
        <PageHeader
          centered
          actions={
            <SearchInput
              query={searchQuery}
              onQueryChange={setSearchQuery}
              placeholder="Search releases"
              className="max-w-lg"
            />
          }
        />
      </div>
      {artists && artistParam && (
        <div className={`flex justify-start w-full ${isCompact ? 'mt-2 sm:mt-4' : 'mt-4 sm:mt-8'}`}>
          <ClearableTag
            href="/browse"
            tagLabel="Artist"
            tagValue={artistMap.get(artistParam)?.displayName as string}
          />
        </div>
      )}
      <div
        className={`grid w-full justify-items-center ${isCompact ? 'm-2 sm:m-4' : 'm-4 sm:m-12'} ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}
      >
        {artists &&
          filteredReleases.map(({ artistRymIds, title, rymId, rymUrl, cover, media }, index) => (
            <MusicTile
              key={rymId}
              cover={cover}
              artists={artistRymIds.map((id) => artistMap.get(id))}
              title={title}
              rymId={rymId}
              rymUrl={rymUrl}
              media={media}
              priority={index < CONFIG.images.priorityLoadCount}
              compact={isCompact}
            />
          ))}
      </div>
    </div>
  )
}
