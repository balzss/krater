import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { updateReleases, getReleases, deleteCoverFile, ensureDirectoryExists } from '@/lib/server'
import {
  parseReleaseFormData,
  parseUpdateFormData,
  saveCoverFile,
  validateNewRelease,
  checkDuplicateRelease,
} from '@/lib/server/form-helpers'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'
import type { Release } from '@/lib/data'

export const dynamic = 'force-dynamic'

const coversDir = path.join(process.cwd(), 'public', 'covers')

// GET: Return all releases
export async function GET(_req: NextRequest) {
  try {
    const releasesData = await getReleases()
    // Return raw array for backward compatibility
    return NextResponse.json(releasesData)
  } catch (error: unknown) {
    console.error('[API RELEASES GET] Error:', error)
    return errorResponse('Failed to fetch releases')
  }
}

// POST: Add a new release
export async function POST(req: NextRequest) {
  try {
    const releasesData = await getReleases()
    await ensureDirectoryExists(coversDir)

    const formData = await req.formData()
    const { releaseData, coverFile, coverFilename } = await parseReleaseFormData(formData)

    // Validation
    validateNewRelease(releaseData)
    checkDuplicateRelease(releasesData, releaseData.rymId!)

    // Handle image upload
    if (coverFile) {
      await saveCoverFile(coverFile, coverFilename, coversDir)
      console.log(`Saved new cover: ${path.join(coversDir, coverFilename)}`)
    } else {
      console.warn(
        `No cover image file uploaded for cover filename: ${coverFilename}. Ensure file exists manually or upload one.`
      )
    }

    // Create and save release data
    const newRelease: Release = {
      title: releaseData.title!,
      rymId: releaseData.rymId!,
      artistRymIds: releaseData.artistRymIds!,
      cover: coverFilename,
      media: releaseData.media!,
      rymUrl: releaseData.rymUrl,
    }

    const updatedReleases = [...releasesData, newRelease]
    await updateReleases(updatedReleases)

    return successResponse(
      { message: 'Release added successfully', release: newRelease },
      201
    )
  } catch (error: unknown) {
    let errorMessage = 'Failed to add release.'
    let statusCode = 500
    if (error instanceof Error) {
      errorMessage = error.message
      if (
        errorMessage.startsWith('Missing required') ||
        errorMessage.startsWith('Invalid JSON') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('cannot be empty') ||
        errorMessage.includes('non-empty') ||
        errorMessage.includes("Malformed 'cover'")
      ) {
        statusCode = 400
      } else if (
        errorMessage.includes('Could not write') ||
        errorMessage.includes('Could not read') ||
        errorMessage.includes('Could not create directory') ||
        errorMessage.includes('Failed to save cover')
      ) {
        statusCode = 500
      }
      console.error(`[API RELEASES POST] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API RELEASES POST] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    const clientMessage =
      statusCode === 400
        ? errorMessage
        : 'An internal server error occurred while adding the release.'
    return errorResponse(clientMessage, statusCode)
  }
}

// PUT: Update an existing release, optionally updating/replacing the cover image
export async function PUT(req: NextRequest) {
  try {
    const releasesData = await getReleases()
    await ensureDirectoryExists(coversDir)

    const formData = await req.formData()
    const { releaseData: updateData, coverFile, coverFilename, rymId } = await parseUpdateFormData(formData)

    // Find existing release
    const releaseIndex = releasesData.findIndex((r) => r.rymId === rymId)
    if (releaseIndex === -1) {
      return errorResponse(`Release with rymId ${rymId} not found.`, 404)
    }

    const originalRelease = releasesData[releaseIndex]
    const oldCoverFilename = originalRelease.cover
    const filenameForSaving = coverFilename || oldCoverFilename

    // Handle image update
    if (coverFile) {
      if (!filenameForSaving) {
        throw new Error('Cannot determine filename for saving uploaded cover image.')
      }
      await saveCoverFile(coverFile, filenameForSaving, coversDir)
      console.log(`Saved updated cover: ${path.join(coversDir, filenameForSaving)}`)

      // Delete old cover if filename changed
      if (oldCoverFilename && oldCoverFilename !== filenameForSaving) {
        await deleteCoverFile(oldCoverFilename)
      }
      updateData.cover = filenameForSaving
    } else if (coverFilename && coverFilename !== oldCoverFilename) {
      // Filename changed but no new file uploaded, delete old file
      console.warn(
        `Cover filename changed to ${coverFilename}, but no new image file uploaded. Deleting old file: ${oldCoverFilename}`
      )
      await deleteCoverFile(oldCoverFilename)
      updateData.cover = coverFilename
    }

    // Merge updates and save
    const updatedReleaseData = {
      ...originalRelease,
      ...updateData,
    }
    releasesData[releaseIndex] = updatedReleaseData as Release
    await updateReleases(releasesData)

    return successResponse(
      { message: 'Release updated successfully', release: updatedReleaseData }
    )
  } catch (error: unknown) {
    let errorMessage = 'Failed to update release.'
    let statusCode = 500
    if (error instanceof Error) {
      errorMessage = error.message
      if (
        errorMessage.startsWith('Missing') ||
        errorMessage.startsWith('Invalid JSON') ||
        errorMessage.includes('cannot be empty') ||
        errorMessage.includes("Malformed new 'cover'")
      ) {
        statusCode = 400
      } else if (
        errorMessage.includes('Could not write') ||
        errorMessage.includes('Could not read') ||
        errorMessage.includes('Could not create directory') ||
        errorMessage.includes('Failed to save updated cover')
      ) {
        statusCode = 500
      }
      console.error(`[API RELEASES PUT] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API RELEASES PUT] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    const clientMessage =
      statusCode === 400
        ? errorMessage
        : 'An internal server error occurred while updating the release.'
    return errorResponse(clientMessage, statusCode)
  }
}

// DELETE: Delete a release and its associated cover image
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rymIdToDelete = searchParams.get('rymId')

    if (!rymIdToDelete) {
      return errorResponse('Missing `rymId` query parameter.', 400)
    }

    const releasesData = await getReleases()
    const releaseIndex = releasesData.findIndex((r) => r.rymId === rymIdToDelete)

    if (releaseIndex === -1) {
      return errorResponse(`Release with rymId '${rymIdToDelete}' not found.`, 404)
    }

    const releaseToDelete = releasesData[releaseIndex]
    const coverFilenameToDelete = releaseToDelete.cover
    const filteredReleases = releasesData.filter((_, index) => index !== releaseIndex)

    await updateReleases(filteredReleases)
    await deleteCoverFile(coverFilenameToDelete)

    return successResponse({
      message: `Release with rymId '${rymIdToDelete}' deleted successfully.`,
    })
  } catch (error: unknown) {
    let errorMessage = 'Failed to delete release.'
    const statusCode = 500
    if (error instanceof Error) {
      if (error.message.includes('Could not write') || error.message.includes('Could not read')) {
        errorMessage = 'Internal Server Error: Could not update data file.'
      } else {
        errorMessage = error.message
      }
      console.error(`[API RELEASES DELETE] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API RELEASES DELETE] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    const clientMessage = 'An internal server error occurred while deleting the release.'
    return errorResponse(clientMessage, statusCode)
  }
}
