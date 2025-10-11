'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface LastFmUser {
  name: string
  realname: string
  url: string
  playcount: string
}

export interface ReleaseWithPlaycount {
  release: {
    artistRymIds: string[]
    title: string
    rymId: string
    rymUrl?: string
    cover: string
    media: { spotify?: string }
  }
  playcount: number
}

export interface LastFmSuggestion {
  name: string
  artist: string
  playcount: number
  url?: string
  image: string | null
}

/**
 * Hook to manage Last.fm connection status
 */
export function useLastFmConnection() {
  const { data, error, mutate } = useSWR<{ user: LastFmUser | null }>('/api/lastfm/user', fetcher)

  const connect = () => {
    window.location.href = '/api/lastfm/connect'
  }

  const disconnect = async () => {
    await fetch('/api/lastfm/disconnect', { method: 'POST' })
    mutate()
  }

  return {
    user: data?.user || null,
    isConnected: !!data?.user,
    isLoading: !data && !error,
    error,
    connect,
    disconnect,
  }
}

/**
 * Hook to fetch Last.fm listening stats for most played
 */
export function useLastFmStats(
  period: '1month' | '3month' | '6month' | '12month' | 'overall' = '1month'
) {
  const { data, error, isLoading } = useSWR<{
    mostPlayed: ReleaseWithPlaycount[]
    leastPlayed: ReleaseWithPlaycount[]
  }>(`/api/lastfm/stats?period=${period}`, fetcher)

  return {
    mostPlayed: data?.mostPlayed || [],
    isLoading,
    error,
  }
}

/**
 * Hook to fetch Last.fm listening stats for least played
 */
export function useLastFmLeastPlayed(
  period: '1month' | '3month' | '6month' | '12month' | 'overall' = '12month'
) {
  const { data, error, isLoading } = useSWR<{
    mostPlayed: ReleaseWithPlaycount[]
    leastPlayed: ReleaseWithPlaycount[]
  }>(`/api/lastfm/stats?period=${period}`, fetcher)

  return {
    leastPlayed: data?.leastPlayed || [],
    isLoading,
    error,
  }
}

/**
 * Hook to fetch Last.fm suggestions
 */
export function useLastFmSuggestions(
  period: '1month' | '3month' | '6month' | '12month' | 'overall' = '3month'
) {
  const { data, error, isLoading } = useSWR<{ suggestions: LastFmSuggestion[] }>(
    `/api/lastfm/suggestions?period=${period}`,
    fetcher
  )

  return {
    suggestions: data?.suggestions || [],
    isLoading,
    error,
  }
}
