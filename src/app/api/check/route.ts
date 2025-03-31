import { NextRequest, NextResponse } from 'next/server'
import { artists, releases } from '@/lib/data'

// Check if the artist exists
function findArtistById(rymId: string) {
  return artists.find((artist) => artist.rymId === rymId)
}

// Check if the release exists
function findReleaseById(rymId: string) {
  return releases.find((release) => release.rymId === rymId)
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

    const missingArtists = artistIds?.filter((id) => !findArtistById(id)) || []
    const missingRelease = releaseId && findReleaseById(releaseId) ? '' : releaseId

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

export const revalidate = 60 // The route will revalidate every 60 seconds
