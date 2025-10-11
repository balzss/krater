import { NextRequest, NextResponse } from 'next/server'
import { getArtists, updateArtists } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'
import { requireAuth } from '@/lib/auth-helpers'
import type { Artist } from '@/lib/data'

interface PutResponsePayload {
  message: string
  updated: Artist[]
  artists: Artist[]
  notFoundIds?: string[]
}

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const artists = await getArtists()
    // Return raw array for backward compatibility
    return NextResponse.json(artists)
  } catch (error: unknown) {
    console.error('[API ARTISTS GET] Error:', error)
    return errorResponse('Failed to fetch artists')
  }
}

export async function POST(req: NextRequest) {
  // Check authentication
  const { response: authResponse } = await requireAuth(req)
  if (authResponse) return authResponse

  try {
    const newArtistsData: Artist | Artist[] = await req.json()
    const artistsToAdd = Array.isArray(newArtistsData) ? newArtistsData : [newArtistsData]

    if (!artistsToAdd.length) {
      return errorResponse('Request body cannot be empty.', 400)
    }
    const invalidArtists = artistsToAdd.filter(
      (a) => !a || typeof a.displayName !== 'string' || typeof a.rymId !== 'string'
    )
    if (invalidArtists.length > 0) {
      return errorResponse(
        'Invalid artist data. Required fields: displayName (string), rymId (string).',
        400,
        { invalidData: invalidArtists }
      )
    }

    const artists = await getArtists()
    const currentRymIds = new Set(artists.map((a) => a.rymId))
    const addedArtists: Artist[] = []
    const skippedArtists: { artist: Artist; reason: string }[] = []

    for (const newArtist of artistsToAdd) {
      if (!currentRymIds.has(newArtist.rymId)) {
        addedArtists.push(newArtist)
        currentRymIds.add(newArtist.rymId)
      } else {
        skippedArtists.push({ artist: newArtist, reason: 'Duplicate rymId' })
      }
    }

    if (addedArtists.length === 0) {
      return successResponse({
        message: 'No new artists were added (duplicates or invalid data skipped).',
        skipped: skippedArtists,
        artists: artists,
      })
    }

    const finalArtists = [...artists, ...addedArtists]
    await updateArtists(finalArtists)

    return successResponse(
      {
        message: `Successfully added ${addedArtists.length} artist(s).`,
        added: addedArtists,
        skipped: skippedArtists,
        artists: finalArtists,
      },
      201
    )
  } catch (error: unknown) {
    let errorMessage = 'Failed to add artists.'
    let statusCode = 500
    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON format in request body.'
      statusCode = 400
    } else if (error instanceof Error) {
      if (error.message.includes('Could not write') || error.message.includes('Could not read')) {
        errorMessage = 'Internal Server Error: Could not update data file.'
      } else {
        errorMessage = error.message
      }
      console.error(`[API ARTISTS POST] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API ARTISTS POST] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    return errorResponse(errorMessage, statusCode)
  }
}

export async function PUT(req: NextRequest) {
  // Check authentication
  const { response: authResponse } = await requireAuth(req)
  if (authResponse) return authResponse

  try {
    const updateData: Artist | Artist[] = await req.json()
    const artistsToUpdate = Array.isArray(updateData) ? updateData : [updateData]

    if (!artistsToUpdate.length) {
      return errorResponse('Request body cannot be empty.', 400)
    }
    const invalidUpdates = artistsToUpdate.filter((a) => !a || typeof a.rymId !== 'string')
    if (invalidUpdates.length > 0) {
      return errorResponse('Invalid update data. Each object must include rymId (string).', 400, {
        invalidData: invalidUpdates,
      })
    }

    const artists = await getArtists()
    const currentArtists = [...artists]
    let updated = false
    const updatedArtistsResult: Artist[] = []
    const notFoundIds: string[] = []

    artistsToUpdate.forEach((updateArtist) => {
      const index = currentArtists.findIndex((a) => a.rymId === updateArtist.rymId)
      if (index !== -1) {
        currentArtists[index] = { ...currentArtists[index], ...updateArtist }
        updatedArtistsResult.push(currentArtists[index])
        updated = true
      } else {
        notFoundIds.push(updateArtist.rymId)
      }
    })

    if (!updated) {
      return errorResponse('No matching artists found to update.', 404, { notFoundIds })
    }

    await updateArtists(currentArtists)

    const responsePayload: PutResponsePayload = {
      message: 'Artists updated successfully.',
      updated: updatedArtistsResult,
      artists: currentArtists,
    }
    if (notFoundIds.length > 0) {
      responsePayload.notFoundIds = notFoundIds
      responsePayload.message = `Update partially successful. ${updatedArtistsResult.length} updated, ${notFoundIds.length} not found.`
    }

    return successResponse(responsePayload)
  } catch (error: unknown) {
    let errorMessage = 'Failed to update artists.'
    let statusCode = 500
    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON format in request body.'
      statusCode = 400
    } else if (error instanceof Error) {
      if (error.message.includes('Could not write') || error.message.includes('Could not read')) {
        errorMessage = 'Internal Server Error: Could not update data file.'
      } else {
        errorMessage = error.message
      }
      console.error(`[API ARTISTS PUT] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API ARTISTS PUT] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    return errorResponse(errorMessage, statusCode)
  }
}

export async function DELETE(req: NextRequest) {
  // Check authentication
  const { response: authResponse } = await requireAuth(req)
  if (authResponse) return authResponse

  try {
    const { searchParams } = new URL(req.url)
    const rymIdToDelete = searchParams.get('rymId')

    if (!rymIdToDelete) {
      return errorResponse('Missing `rymId` query parameter.', 400)
    }

    const artists = await getArtists()
    const filteredArtists = artists.filter((a) => a.rymId !== rymIdToDelete)

    if (filteredArtists.length === artists.length) {
      return errorResponse(`Artist with rymId '${rymIdToDelete}' not found.`, 404)
    }

    await updateArtists(filteredArtists)

    return successResponse({
      message: `Artist with rymId '${rymIdToDelete}' deleted successfully.`,
      artists: filteredArtists,
    })
  } catch (error: unknown) {
    let errorMessage = 'Failed to delete artist.'
    const statusCode = 500
    if (error instanceof Error) {
      if (error.message.includes('Could not write') || error.message.includes('Could not read')) {
        errorMessage = 'Internal Server Error: Could not update data file.'
      } else {
        errorMessage = error.message
      }
      console.error(`[API ARTISTS DELETE] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API ARTISTS DELETE] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    return errorResponse(errorMessage, statusCode)
  }
}
