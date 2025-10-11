import { NextRequest, NextResponse } from 'next/server'
import { fetchUserTopAlbums } from '@/lib/lastfm'
import { matchLibraryToLastFm } from '@/lib/lastfm/matching'
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
      '1month'

    // Fetch user's top albums from Last.fm
    const topAlbums = await fetchUserTopAlbums(sessionKey, { limit: 200, period })

    // Fetch library data
    const { releases, artists } = await getLibraryData()

    // Match Last.fm albums to library releases
    const matchedStats = matchLibraryToLastFm(releases, artists, topAlbums)

    // Sort by playcount for most played (top 12)
    const mostPlayed = matchedStats
      .filter((s) => s.playcount > 0)
      .sort((a, b) => b.playcount - a.playcount)
      .slice(0, 12)

    // Least played: sort by playcount, then randomize those with same playcount
    // Group by playcount
    const grouped = new Map<number, typeof matchedStats>()
    matchedStats.forEach((stat) => {
      if (!grouped.has(stat.playcount)) {
        grouped.set(stat.playcount, [])
      }
      grouped.get(stat.playcount)!.push(stat)
    })

    // Randomize within each playcount group and combine
    const leastPlayed = Array.from(grouped.entries())
      .sort(([a], [b]) => a - b) // Sort by playcount ascending
      .flatMap(([_count, items]) => {
        // Fisher-Yates shuffle
        const shuffled = [...items]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      })
      .slice(0, 12)

    return NextResponse.json({
      mostPlayed: mostPlayed.map((s) => ({
        release: s.release,
        playcount: s.playcount,
      })),
      leastPlayed: leastPlayed.map((s) => ({
        release: s.release,
        playcount: s.playcount,
      })),
    })
  } catch (error) {
    console.error('Error fetching Last.fm stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: errorMessage },
      { status: 500 }
    )
  }
}
