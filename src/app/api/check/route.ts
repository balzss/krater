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
    const artistId = searchParams.get('artistId')
    const releaseId = searchParams.get('releaseId')

    if (!artistId && !releaseId) {
      return NextResponse.json(
        { message: 'Please provide either an artistId or releaseId in the query string.' },
        { status: 400 }
      )
    }

    if (artistId) {
      // Check if the artist exists
      const artist = findArtistById(artistId)
      if (artist) {
        return NextResponse.json({ message: 'Artist found', artist }, { status: 200 })
      } else {
        return NextResponse.json({ message: 'Artist not found' }, { status: 404 })
      }
    }

    if (releaseId) {
      // Check if the release exists
      const release = findReleaseById(releaseId)
      if (release) {
        return NextResponse.json({ message: 'Release found', release }, { status: 200 })
      } else {
        return NextResponse.json({ message: 'Release not found' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { message: 'No valid artistId or releaseId provided' },
      { status: 400 }
    )
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
