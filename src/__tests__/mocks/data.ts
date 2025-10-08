import type { LibraryData, Release, Artist } from '@/lib/data'

export const mockArtists: Artist[] = [
  {
    displayName: 'Radiohead',
    rymId: 'radiohead',
    rymUrl: 'https://rateyourmusic.com/artist/radiohead',
  },
  {
    displayName: 'Aphex Twin',
    rymId: 'aphex-twin',
    rymUrl: 'https://rateyourmusic.com/artist/aphex_twin',
  },
  {
    displayName: 'Nine Inch Nails',
    rymId: 'nine-inch-nails',
  },
]

export const mockReleases: Release[] = [
  {
    title: 'OK Computer',
    rymId: 'ok-computer',
    rymUrl: 'https://rateyourmusic.com/release/album/radiohead/ok-computer',
    artistRymIds: ['radiohead'],
    cover: 'ok-computer.jpg',
    media: {
      spotify: 'https://open.spotify.com/album/6dVIqQ8qmQ5GBnJ9shOYGE',
    },
  },
  {
    title: 'Selected Ambient Works 85-92',
    rymId: 'saw-85-92',
    artistRymIds: ['aphex-twin'],
    cover: 'saw-85-92.jpg',
    media: {
      spotify: 'https://open.spotify.com/album/7aNclGRxTysfh6z0d8671k',
    },
  },
  {
    title: 'The Downward Spiral',
    rymId: 'downward-spiral',
    artistRymIds: ['nine-inch-nails'],
    cover: 'downward-spiral.jpg',
    media: {},
  },
]

export const mockLibraryData: LibraryData = {
  releases: mockReleases,
  artists: mockArtists,
}

export function createMockRelease(overrides?: Partial<Release>): Release {
  return {
    title: 'Test Album',
    rymId: 'test-album',
    artistRymIds: ['test-artist'],
    cover: 'test-cover.jpg',
    media: { spotify: 'https://open.spotify.com/album/test' },
    ...overrides,
  }
}

export function createMockArtist(overrides?: Partial<Artist>): Artist {
  return {
    displayName: 'Test Artist',
    rymId: 'test-artist',
    ...overrides,
  }
}
