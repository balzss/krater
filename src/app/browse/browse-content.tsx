'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { House } from 'lucide-react'
import { MusicTile, SearchInput, ClearableTag } from '@/components'
import { useFetchJson } from '@/hooks'
import type { Artist, Release } from '@/lib/data'

export default function BrowsePageContent() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const {
    data: releases,
    loading: _relesesLoading,
    error: _releasesError,
  } = useFetchJson<Release[]>('/krater/data/releases.json')
  const {
    data: artists,
    loading: _artistsLoading,
    error: _artistsError,
  } = useFetchJson<Artist[]>('/krater/data/artists.json')

  const searchParams = useSearchParams()
  const artistParam = searchParams.get('a')

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
      <div className="flex items-center w-full max-w-lg gap-4 sm:gap-6">
        <SearchInput
          query={searchQuery}
          onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
        />
        <a href="/krater" className="flex justify-center items-center text-(--icon)">
          <House size={40} />
        </a>
      </div>
      {artists && artistParam && (
        <div className="flex justify-start w-full mt-4 sm:mt-8">
          <ClearableTag
            href="/krater/browse"
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
