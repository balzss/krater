import { NextRequest, NextResponse } from 'next/server'
import { fetchUserTopAlbums } from '@/lib/lastfm'
import { matchReleaseToLastFm } from '@/lib/lastfm/matching'
import { getLibraryData } from '@/lib/server'

export async function GET(request: NextRequest) {
  try {
    // Get session key from cookie
    const sessionKey = request.cookies.get('lastfm-session-key')?.value

    if (!sessionKey) {
      return NextResponse.json({ error: 'Not connected to Last.fm' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period =
      (searchParams.get('period') as '1month' | '3month' | '6month' | '12month' | 'overall') ||
      '3month'

    // Fetch user's top albums from Last.fm
    const topAlbums = await fetchUserTopAlbums(sessionKey, { limit: 200, period })

    // Fetch library data
    const { releases, artists } = await getLibraryData()

    // Filter out albums already in library
    const suggestions = topAlbums
      .filter((lfAlbum) => {
        // Check if this Last.fm album matches any release in the library
        const match = releases.some((release) => {
          const releaseMatch = matchReleaseToLastFm(release, artists, [lfAlbum])
          return releaseMatch !== null
        })
        return !match
      })
      .slice(0, 12)
      .map((album) => ({
        name: album.name,
        artist: typeof album.artist === 'string' ? album.artist : album.artist.name,
        playcount: album.playcount,
        url: album.url,
        image: album.image?.find((img) => img.size === 'large')?.['#text'] || null,
      }))

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching Last.fm suggestions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: errorMessage },
      { status: 500 }
    )
  }
}
