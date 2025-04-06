import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { artists as initialArtists, type Artist } from '@/lib/data'

const artistsFilePath = path.join(process.cwd(), 'src', 'lib', 'artists.ts')

/*
 * =============================================================================
 * 🚨 WARNING: Modifying source code directly from an API is unconventional and risky! 🚨
 * =============================================================================
 * - Concurrency issues, build process interference, scalability limits (serverless),
 * and potential security risks are associated with this pattern.
 * - Consider databases, separate data files (JSON), or external APIs instead.
 * - This implementation is primarily for demonstration or specific local tooling.
 * =============================================================================
 */

// Reads the raw content of the artists.ts file.
async function readArtistsFileContent(): Promise<string> {
  try {
    return await fs.readFile(artistsFilePath, 'utf-8')
  } catch (error: unknown) {
    console.error('Error reading artists file:', error)
    throw new Error('Could not read artists data file.')
  }
}

// Rewrites the artists.ts file with the provided artists array.
async function writeArtistsToFile(artists: Artist[]): Promise<void> {
  const fileContent = await readArtistsFileContent()
  console.log(fileContent)

  // FRAGILE: Relies on specific string markers in the source file.
  const startMarker = 'export const artists: Artist[] = ['
  const endMarker = ']'

  const startIndex = fileContent.indexOf(startMarker)
  const endIndex = fileContent.lastIndexOf(endMarker, fileContent.length)

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.error(
      `File parsing markers not found correctly. Start index: ${startIndex}, End index: ${endIndex}`
    )
    throw new Error('Could not find artists array definition markers in src/lib/artists.ts.')
  }

  // Construct the string for the new array data
  let newArrayString = '\n'
  artists.forEach((artist) => {
    const displayName = artist.displayName.replace(/'/g, "\\'")
    const rymId = artist.rymId.replace(/'/g, "\\'")
    const rymUrl = artist.rymUrl ? artist.rymUrl.replace(/'/g, "\\'") : null
    newArrayString += `  {\n`
    newArrayString += `    displayName: '${displayName}',\n`
    newArrayString += `    rymId: '${rymId}',\n`
    if (rymUrl) newArrayString += `    rymUrl: '${rymUrl}',\n`
    newArrayString += `  },\n`
  })

  // Rebuild the file content string
  const newFileContent =
    fileContent.substring(0, startIndex + startMarker.length) +
    newArrayString +
    fileContent.substring(endIndex)

  try {
    // Note: File writes might trigger dev server restarts.
    await fs.writeFile(artistsFilePath, newFileContent, 'utf-8')
  } catch (error: unknown) {
    console.error('Error writing artists file:', error)
    throw new Error('Could not write artists data file.')
  }
}

// Interface for the PUT response payload structure
interface PutResponsePayload {
  message: string
  updated: Artist[]
  artists: Artist[]
  notFoundIds?: string[]
}

export const dynamic = 'force-static'
// --- API Route Handlers ---

export async function GET(_req: NextRequest) {
  try {
    // Return the initially imported artists array for GET requests.
    return NextResponse.json(initialArtists)
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

    const currentArtists = [...initialArtists]
    const currentRymIds = new Set(currentArtists.map((a) => a.rymId))
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
          artists: currentArtists,
        },
        { status: 200 }
      )
    }

    const finalArtists = [...currentArtists, ...addedArtists]
    await writeArtistsToFile(finalArtists)

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

    const currentArtists = [...initialArtists]
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

    await writeArtistsToFile(currentArtists)

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

    const currentArtists = [...initialArtists]
    const initialLength = currentArtists.length
    const filteredArtists = currentArtists.filter((a) => a.rymId !== rymIdToDelete)

    if (filteredArtists.length === initialLength) {
      return NextResponse.json(
        { message: `Artist with rymId '${rymIdToDelete}' not found.` },
        { status: 404 }
      )
    }

    await writeArtistsToFile(filteredArtists)

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
