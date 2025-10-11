import Fuse from 'fuse.js'
import type { Release, Artist } from '@/lib/data'
import type { LastFmAlbum } from './api'

/**
 * Normalize string for comparison by removing special characters and lowercasing
 */
function normalizeString(str: string | undefined | null | unknown): string {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Match a release from the library to a Last.fm album
 * Uses exact matching first, then falls back to fuzzy matching with Fuse.js
 */
export function matchReleaseToLastFm(
  release: Release,
  artists: Artist[],
  lastFmAlbums: LastFmAlbum[]
): LastFmAlbum | null {
  const releaseTitle = normalizeString(release.title)
  const releaseArtists = release.artistRymIds
    .map((id) => artists.find((a) => a.rymId === id))
    .filter(Boolean)
    .map((a) => normalizeString(a!.displayName))

  // First try exact match
  for (const lfAlbum of lastFmAlbums) {
    const lfTitle = normalizeString(lfAlbum.name)
    const artistName = typeof lfAlbum.artist === 'string' ? lfAlbum.artist : lfAlbum.artist.name
    const lfArtist = normalizeString(artistName)

    if (releaseTitle === lfTitle && releaseArtists.some((a) => a === lfArtist)) {
      return lfAlbum
    }
  }

  // Fall back to fuzzy match with Fuse.js
  const fuse = new Fuse(lastFmAlbums, {
    keys: ['name', 'artist'],
    threshold: 0.3,
  })

  const query = `${release.title} ${releaseArtists.join(' ')}`
  const results = fuse.search(query)

  return results.length > 0 ? results[0].item : null
}

/**
 * Match all releases in library to Last.fm albums
 */
export function matchLibraryToLastFm(
  releases: Release[],
  artists: Artist[],
  lastFmAlbums: LastFmAlbum[]
): Array<{ release: Release; lastFmMatch: LastFmAlbum | null; playcount: number }> {
  return releases.map((release) => {
    const match = matchReleaseToLastFm(release, artists, lastFmAlbums)
    return {
      release,
      lastFmMatch: match,
      playcount: match?.playcount || 0,
    }
  })
}
