export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
export const API_BASE_URL = `${BASE_PATH}/api`
export const COVERS_PATH = `${BASE_PATH}/covers`
export const DATA_PATH = `${BASE_PATH}/data`
export const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_MODE === 'export'

export const MEDIA_PLAYERS = {
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    priority: 1,
  },
  appleMusic: {
    name: 'Apple Music',
    color: '#FA243C',
    priority: 2,
  },
  bandcamp: {
    name: 'Bandcamp',
    color: '#1DA0C3',
    priority: 3,
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    priority: 4,
  },
  soundcloud: {
    name: 'SoundCloud',
    color: '#FF5500',
    priority: 5,
  },
  tidal: {
    name: 'Tidal',
    color: '#000000',
    priority: 6,
  },
  deezer: {
    name: 'Deezer',
    color: '#FF0092',
    priority: 7,
  },
} as const

export type MediaPlayer = keyof typeof MEDIA_PLAYERS

export const CONFIG = {
  images: {
    priorityLoadCount: 16, // Increased from 8 to cover ~1.5 viewports
  },
  auth: {
    cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    cookieName: 'admin-session',
  },
  spotify: {
    codeVerifierLength: 128,
    clientId: '47802db6dc5249cbaa5dba475f04cc4d',
  },
  layout: {
    standard: {
      gridGap: 'gap-4 sm:gap-8',
      gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    },
    compact: {
      gridGap: 'gap-2 sm:gap-4',
      gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
    },
  },
  media: {
    defaultPlayer: 'spotify' as MediaPlayer,
    fallbackOrder: [
      'spotify',
      'appleMusic',
      'bandcamp',
      'youtube',
      'soundcloud',
      'tidal',
      'deezer',
    ] as MediaPlayer[],
  },
} as const
