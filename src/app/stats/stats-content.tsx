'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useLastFmStats,
  useLastFmLeastPlayed,
  useLastFmSuggestions,
  useLastFmConnection,
} from '@/hooks/use-lastfm'
import { MusicTile, SuggestionTile, PageHeader, TimeRangeSelect } from '@/components'
import { useLibraryData } from '@/hooks'

export default function StatsPageContent() {
  const [timeRange, setTimeRange] = useState<
    '1month' | '3month' | '6month' | '12month' | 'overall'
  >('1month')
  const [leastPlayedTimeRange, setLeastPlayedTimeRange] = useState<
    '1month' | '3month' | '6month' | '12month' | 'overall'
  >('12month')
  const [suggestionsTimeRange, setSuggestionsTimeRange] = useState<
    '1month' | '3month' | '6month' | '12month' | 'overall'
  >('3month')

  const { isConnected, isLoading: connectionLoading } = useLastFmConnection()
  const { mostPlayed, isLoading: statsLoading, error: statsError } = useLastFmStats(timeRange)
  const {
    leastPlayed,
    isLoading: leastPlayedLoading,
    error: leastPlayedError,
  } = useLastFmLeastPlayed(leastPlayedTimeRange)
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useLastFmSuggestions(suggestionsTimeRange)
  const { artists, isLoading: artistsLoading } = useLibraryData({ enabled: true })

  // Log errors for debugging
  if (statsError) {
    console.error('Stats error:', statsError)
  }
  if (leastPlayedError) {
    console.error('Least played error:', leastPlayedError)
  }
  if (suggestionsError) {
    console.error('Suggestions error:', suggestionsError)
  }

  if (connectionLoading || artistsLoading) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="Listening Stats" />
        <div className="mt-8 text-center text-gray-600">Loading...</div>
      </div>
    )
  }

  // Safety check for artists data
  if (!artists || artists.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="Listening Stats" />
        <div className="mt-8 text-center text-gray-600">No library data found.</div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="Listening Stats" />
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Connect your Last.fm account to see your listening statistics.
          </p>
          <Link
            href="/settings"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Listening Stats" />

      {/* Suggestions Section - First */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-2xl font-bold">Not in Your Library</h2>
          <TimeRangeSelect value={suggestionsTimeRange} onChange={setSuggestionsTimeRange} />
        </div>

        <p className="text-(--foreground) opacity-70 mb-4 text-sm">
          Based on your Last.fm listening history, these albums are not in your library yet.
        </p>

        {suggestionsLoading ? (
          <div className="text-(--foreground) opacity-70">Loading suggestions...</div>
        ) : suggestionsError ? (
          <div className="text-red-600">Failed to load suggestions. Please try again.</div>
        ) : suggestions.length === 0 ? (
          <div className="text-(--foreground) opacity-70">
            No suggestions found. All your top albums are already in your library!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {suggestions.map((suggestion, index) => (
              <SuggestionTile
                key={`${suggestion.artist}-${suggestion.name}-${index}`}
                name={suggestion.name}
                artist={suggestion.artist}
                playcount={suggestion.playcount}
                url={suggestion.url}
                image={suggestion.image}
              />
            ))}
          </div>
        )}
      </section>

      {/* Least Played Section - Second */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-2xl font-bold">Least Played</h2>
          <TimeRangeSelect value={leastPlayedTimeRange} onChange={setLeastPlayedTimeRange} />
        </div>

        <p className="text-(--foreground) opacity-70 mb-4 text-sm">
          Albums from your library with the fewest plays in the selected time period.
        </p>

        {leastPlayedLoading ? (
          <div className="text-(--foreground) opacity-70">Loading...</div>
        ) : leastPlayedError ? (
          <div className="text-red-600">Failed to load data. Please try again.</div>
        ) : leastPlayed.length === 0 ? (
          <div className="text-(--foreground) opacity-70">No data available for this period.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {leastPlayed.map(({ release, playcount }) => {
              const releaseArtists = release.artistRymIds
                .map((id) => artists.find((a) => a.rymId === id))
                .filter(Boolean)

              return (
                <div key={release.rymId} className="relative">
                  <MusicTile
                    cover={release.cover}
                    artists={releaseArtists}
                    title={release.title}
                    rymId={release.rymId}
                    rymUrl={release.rymUrl}
                    media={release.media}
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                    {playcount} plays
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Most Played Section - Last */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-2xl font-bold">Most Played</h2>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>

        {statsLoading ? (
          <div className="text-(--foreground) opacity-70">Loading stats...</div>
        ) : statsError ? (
          <div className="text-red-600">Failed to load stats. Please try again.</div>
        ) : mostPlayed.length === 0 ? (
          <div className="text-(--foreground) opacity-70">
            No listening data found for this period.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mostPlayed.map(({ release, playcount }) => {
              const releaseArtists = release.artistRymIds
                .map((id) => artists.find((a) => a.rymId === id))
                .filter(Boolean)

              return (
                <div key={release.rymId} className="relative">
                  <MusicTile
                    cover={release.cover}
                    artists={releaseArtists}
                    title={release.title}
                    rymId={release.rymId}
                    rymUrl={release.rymUrl}
                    media={release.media}
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                    {playcount} plays
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
