import { NextRequest, NextResponse } from 'next/server'
import { artists } from '@/lib/data'
import { readReleasesFile } from '@/lib/server'

export const dynamic = 'force-static'

// Check if the artist exists
function findArtistById(rymId: string) {
  return artists.find((artist) => artist.rymId === rymId)
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const { searchParams } = url
    const artistIds = searchParams.get('artistId')?.split(',')
    const releaseId = searchParams.get('releaseId')

    if (!artistIds?.length && !releaseId) {
      return NextResponse.json(
        { message: 'Please provide either an artistIds or releaseId in the query string.' },
        { status: 400 }
      )
    }

    const releases = await readReleasesFile()

    const missingArtists = artistIds?.filter((id) => !findArtistById(id)) || []
    const missingRelease =
      releaseId && releases.find((release) => release.rymId === releaseId) ? '' : releaseId

    return NextResponse.json({ missingArtists, missingRelease }, { status: 200 })
  } catch (error) {
    console.error('Error checking for artist or release:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
