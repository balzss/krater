import { type NextRequest } from 'next/server'
import { getLibraryData } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const { searchParams } = url
    const artistIds = searchParams.get('artistId')?.split(',')
    const releaseId = searchParams.get('releaseId')

    if (!artistIds?.length && !releaseId) {
      return errorResponse('Please provide either an artistIds or releaseId in the query string.', 400)
    }

    const libraryData = await getLibraryData()
    const { releases, artists } = libraryData

    const missingArtists = artistIds?.filter((id) => !artists.find((a) => a.rymId === id)) || []

    const missingRelease =
      releaseId && releases.find((release) => release.rymId === releaseId) ? '' : releaseId

    return successResponse({ missingArtists, missingRelease })
  } catch (error) {
    console.error('Error checking for artist or release:', error)
    return errorResponse(
      'Internal Server Error',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}
