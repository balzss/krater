import { MEDIA_PLAYERS, MediaPlayer, CONFIG } from './constants'
import type { Media } from './data'

/**
 * Get all available media players for a release, sorted by priority
 */
export function getAvailableMediaPlayers(media: Media): MediaPlayer[] {
  return (Object.keys(media) as MediaPlayer[])
    .filter((key): key is MediaPlayer => {
      // Type guard to ensure key exists in MEDIA_PLAYERS
      return key in MEDIA_PLAYERS && !!media[key]
    })
    .sort((a, b) => MEDIA_PLAYERS[a].priority - MEDIA_PLAYERS[b].priority)
}

/**
 * Get the preferred media URL based on user preference and fallback order
 */
export function getPreferredMediaUrl(
  media: Media,
  preferredPlayer: MediaPlayer,
  fallbackOrder: MediaPlayer[] = CONFIG.media.fallbackOrder
): string | null {
  // Try preferred player first
  if (media[preferredPlayer]) {
    return media[preferredPlayer] || null
  }

  // Try fallback order
  for (const player of fallbackOrder) {
    if (media[player]) {
      return media[player] || null
    }
  }

  // Try any available player
  const available = getAvailableMediaPlayers(media)
  if (available.length > 0) {
    return media[available[0]] || null
  }

  return null
}

/**
 * Detect which media player a URL belongs to
 */
export function getMediaPlayerName(url: string | null): string | null {
  if (!url) return null

  if (url.includes('spotify.com')) return 'Spotify'
  if (url.includes('music.apple.com')) return 'Apple Music'
  if (url.includes('bandcamp.com')) return 'Bandcamp'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  if (url.includes('soundcloud.com')) return 'SoundCloud'
  if (url.includes('tidal.com')) return 'Tidal'
  if (url.includes('deezer.com')) return 'Deezer'

  return 'External'
}

/**
 * Get the media player key from a URL
 */
export function getMediaPlayerKey(url: string | null): MediaPlayer | null {
  if (!url) return null

  if (url.includes('spotify.com')) return 'spotify'
  if (url.includes('music.apple.com')) return 'appleMusic'
  if (url.includes('bandcamp.com')) return 'bandcamp'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('soundcloud.com')) return 'soundcloud'
  if (url.includes('tidal.com')) return 'tidal'
  if (url.includes('deezer.com')) return 'deezer'

  return null
}
