import { NextRequest, NextResponse } from 'next/server'
import { getArtists, updateArtists } from '@/lib/server'
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
    return NextResponse.json(artists)
  } catch (error: unknown) {
    console.error('[API ARTISTS GET] Error:', error)
    return NextResponse.json({ message: 'Failed to fetch artists' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const newArtistsData: Artist | Artist[] = await req.json()
    const artistsToAdd = Array.isArray(newArtistsData) ? newArtistsData : [newArtistsData]

    if (!artistsToAdd.length) {
      return NextResponse.json({ message: 'Request body cannot be empty.' }, { status: 400 })
    }
    const invalidArtists = artistsToAdd.filter(
      (a) => !a || typeof a.displayName !== 'string' || typeof a.rymId !== 'string'
    )
    if (invalidArtists.length > 0) {
      return NextResponse.json(
        {
          message: 'Invalid artist data. Required fields: displayName (string), rymId (string).',
          invalidData: invalidArtists,
        },
        { status: 400 }
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
      return NextResponse.json(
        {
          message: 'No new artists were added (duplicates or invalid data skipped).',
          skipped: skippedArtists,
          artists: artists,
        },
        { status: 200 }
      )
    }

    const finalArtists = [...artists, ...addedArtists]
    await updateArtists(finalArtists)

    return NextResponse.json(
      {
        message: `Successfully added ${addedArtists.length} artist(s).`,
        added: addedArtists,
        skipped: skippedArtists,
        artists: finalArtists,
      },
      { status: 201 }
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
    return NextResponse.json({ message: errorMessage }, { status: statusCode })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updateData: Artist | Artist[] = await req.json()
    const artistsToUpdate = Array.isArray(updateData) ? updateData : [updateData]

    if (!artistsToUpdate.length) {
      return NextResponse.json({ message: 'Request body cannot be empty.' }, { status: 400 })
    }
    const invalidUpdates = artistsToUpdate.filter((a) => !a || typeof a.rymId !== 'string')
    if (invalidUpdates.length > 0) {
      return NextResponse.json(
        {
          message: 'Invalid update data. Each object must include rymId (string).',
          invalidData: invalidUpdates,
        },
        { status: 400 }
      )
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
      return NextResponse.json(
        { message: 'No matching artists found to update.', notFoundIds },
        { status: 404 }
      )
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

    return NextResponse.json(responsePayload, { status: 200 })
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
    return NextResponse.json({ message: errorMessage }, { status: statusCode })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rymIdToDelete = searchParams.get('rymId')

    if (!rymIdToDelete) {
      return NextResponse.json({ message: 'Missing `rymId` query parameter.' }, { status: 400 })
    }

    const artists = await getArtists()
    const filteredArtists = artists.filter((a) => a.rymId !== rymIdToDelete)

    if (filteredArtists.length === artists.length) {
      return NextResponse.json(
        { message: `Artist with rymId '${rymIdToDelete}' not found.` },
        { status: 404 }
      )
    }

    await updateArtists(filteredArtists)

    return NextResponse.json(
      {
        message: `Artist with rymId '${rymIdToDelete}' deleted successfully.`,
        artists: filteredArtists,
      },
      { status: 200 }
    )
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
    return NextResponse.json({ message: errorMessage }, { status: statusCode })
  }
}
