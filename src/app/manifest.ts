import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Krater Music Collection',
    short_name: 'Krater',
    description: 'Music Collection and Recommandations',
    start_url: '/krater',
    display: 'standalone',
    background_color: '#1a1a1a',
    theme_color: '#1a1a1a',
    icons: [
      {
        src: '/krater/library-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/krater/library-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
