import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { updateReleases, getReleases, deleteCoverFile, ensureDirectoryExists } from '@/lib/server'
import type { Release } from '@/lib/data'

const coversDir = path.join(process.cwd(), 'public', 'covers')

// GET: Return all releases
export async function GET(_req: NextRequest) {
  try {
    const releasesData = await getReleases()
    return NextResponse.json(releasesData)
  } catch (error: unknown) {
    console.error('[API RELEASES GET] Error:', error)
    return NextResponse.json({ message: 'Failed to fetch releases' }, { status: 500 })
  }
}

// POST: Add a new release
export async function POST(req: NextRequest) {
  try {
    const releasesData = await getReleases()
    await ensureDirectoryExists(coversDir)
    const formData = await req.formData()
    const newReleaseData: Partial<Release> = {}
    let coverFile: File | null = null
    let rawCoverFilenameFromForm: string | undefined = undefined // Store the raw filename from form
    let finalDecodedCoverFilename = '' // To store the decoded & normalized name

    // Extract fields
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'coverImage') coverFile = value
      } else {
        if (key === 'title' || key === 'rymId' || key === 'rymUrl') {
          newReleaseData[key] = value
        } else if (key === 'cover') {
          // Store the raw filename from the form first
          rawCoverFilenameFromForm = value
        } else if (key === 'artistRymIds') {
          try {
            console.log(value)
            newReleaseData.artistRymIds = JSON.parse(value)
          } catch {
            throw new Error('Invalid JSON format for artistRymIds')
          }
        } else if (key === 'media') {
          try {
            newReleaseData.media = JSON.parse(value)
          } catch {
            throw new Error('Invalid JSON format for media')
          }
        }
      }
    }

    // --- Decode and Normalize Cover Filename ---
    if (!rawCoverFilenameFromForm) {
      throw new Error("Missing required 'cover' field (filename) in form data.")
    }
    try {
      // Decode potential percent-encoding, then normalize Unicode
      finalDecodedCoverFilename = decodeURIComponent(rawCoverFilenameFromForm).normalize('NFC')
      if (!finalDecodedCoverFilename)
        throw new Error('Cover filename cannot be empty after decoding.') // Check if empty after decode
    } catch (e) {
      // If decoding fails, it's a bad request
      if (e instanceof URIError) {
        console.error(
          `[API RELEASES POST] URIError decoding cover filename: ${rawCoverFilenameFromForm}`,
          e
        )
        return NextResponse.json(
          { message: `Malformed 'cover' filename provided: ${rawCoverFilenameFromForm}` },
          { status: 400 }
        )
      }
      throw e // Re-throw other errors
    }

    // Assign the processed filename to the data object
    newReleaseData.cover = finalDecodedCoverFilename

    // --- Validation ---
    if (
      !newReleaseData.title ||
      !newReleaseData.rymId ||
      !newReleaseData.artistRymIds ||
      !newReleaseData.media
    ) {
      throw new Error('Missing required fields: title, rymId, artistRymIds, media')
    }
    if (releasesData.some((r) => r.rymId === newReleaseData.rymId)) {
      throw new Error(`Release with rymId ${newReleaseData.rymId} already exists.`)
    }
    if (!Array.isArray(newReleaseData.artistRymIds) || newReleaseData.artistRymIds.length === 0) {
      throw new Error('artistRymIds must be a non-empty array.')
    }

    // --- Handle Image Upload ---
    if (coverFile) {
      if (coverFile.size === 0) throw new Error('Cover image file cannot be empty.')
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      // ** Use the DECODED and NORMALIZED filename for saving **
      const savePath = path.join(coversDir, finalDecodedCoverFilename)
      try {
        await fs.writeFile(savePath, buffer)
        console.log(`Saved new cover: ${savePath}`)
      } catch (writeError) {
        console.error(`[API RELEASES POST] Error writing cover file ${savePath}:`, writeError)
        throw new Error(`Failed to save cover image file: ${finalDecodedCoverFilename}`)
      }
    } else {
      console.warn(
        `No cover image file uploaded for cover filename: ${finalDecodedCoverFilename}. Ensure file exists manually or upload one.`
      )
    }

    // --- Create and Save Release Data ---
    const newRelease: Release = {
      // Ensure all required fields are present and correctly typed
      title: newReleaseData.title!,
      rymId: newReleaseData.rymId!,
      artistRymIds: newReleaseData.artistRymIds!,
      cover: finalDecodedCoverFilename, // ** Store the DECODED and NORMALIZED filename **
      media: newReleaseData.media!,
      rymUrl: newReleaseData.rymUrl, // Optional
    }

    const updatedReleases = [...releasesData, newRelease]
    await updateReleases(updatedReleases)

    return NextResponse.json(
      { message: 'Release added successfully', release: newRelease },
      { status: 201 }
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
    // Avoid sending potentially sensitive internal error messages directly
    const clientMessage =
      statusCode === 400
        ? errorMessage
        : 'An internal server error occurred while adding the release.'
    return NextResponse.json({ message: clientMessage }, { status: statusCode })
  }
}

// PUT: Update an existing release, optionally updating/replacing the cover image
export async function PUT(req: NextRequest) {
  try {
    const releasesData = await getReleases()
    await ensureDirectoryExists(coversDir)
    const formData = await req.formData()
    const updateData: Partial<Release> = {}
    let coverFile: File | null = null
    let rawNewCoverFilename: string | undefined = undefined // Raw filename from 'cover' field
    let finalDecodedNewCoverFilename: string | undefined = undefined // Decoded & normalized new filename

    // --- Extract Data ---
    if (!formData.has('rymId')) {
      throw new Error("Missing 'rymId' field in form data to identify the release to update.")
    }
    updateData.rymId = formData.get('rymId') as string

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'coverImage') coverFile = value
      } else {
        if (key === 'rymId') continue
        if (key === 'title' || key === 'rymId' || key === 'rymUrl') {
          updateData[key] = value
        } else if (key === 'cover') {
          rawNewCoverFilename = value // Store raw filename if provided
        } else if (key === 'artistRymIds') {
          try {
            console.log(value)
            updateData.artistRymIds = JSON.parse(value)
          } catch {
            throw new Error('Invalid JSON format for artistRymIds')
          }
        } else if (key === 'media') {
          try {
            updateData.media = JSON.parse(value)
          } catch {
            throw new Error('Invalid JSON format for media')
          }
        }
      }
    }

    // --- Decode and Normalize NEW Cover Filename (if provided) ---
    if (rawNewCoverFilename !== undefined) {
      try {
        finalDecodedNewCoverFilename = decodeURIComponent(rawNewCoverFilename).normalize('NFC')
        if (!finalDecodedNewCoverFilename)
          throw new Error('Cover filename cannot be empty after decoding.')
        // Assign the processed filename to be potentially saved
        updateData.cover = finalDecodedNewCoverFilename
      } catch (e) {
        if (e instanceof URIError) {
          console.error(
            `[API RELEASES PUT] URIError decoding new cover filename: ${rawNewCoverFilename}`,
            e
          )
          return NextResponse.json(
            { message: `Malformed new 'cover' filename provided: ${rawNewCoverFilename}` },
            { status: 400 }
          )
        }
        throw e // Re-throw other errors
      }
    }

    // --- Find Existing Release ---
    const releaseIndex = releasesData.findIndex((r) => r.rymId === updateData.rymId)
    if (releaseIndex === -1) {
      return NextResponse.json(
        { message: `Release with rymId ${updateData.rymId} not found.` },
        { status: 404 }
      )
    }
    const originalRelease = releasesData[releaseIndex]
    // The old filename stored should already be decoded/normalized if POST was fixed
    const oldCoverFilename = originalRelease.cover

    // Determine the filename to use for saving the new file (if any)
    // Use the newly provided (and decoded) name, or fall back to the old name if uploading a file without specifying a new name.
    const filenameForSaving = finalDecodedNewCoverFilename ?? oldCoverFilename

    // --- Handle Image Update ---
    if (coverFile) {
      if (!filenameForSaving) {
        // This case should be rare if oldCoverFilename exists, but good to handle
        console.error(
          '[API RELEASES PUT] Cannot save cover image: No filename determined (new or old).'
        )
        throw new Error('Cannot determine filename for saving uploaded cover image.')
      }
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      // ** Use the DECODED/NORMALIZED filename for saving **
      const savePath = path.join(coversDir, filenameForSaving)
      try {
        await fs.writeFile(savePath, buffer)
        console.log(`Saved updated cover: ${savePath}`)
      } catch (writeError) {
        console.error(`[API RELEASES PUT] Error writing cover file ${savePath}:`, writeError)
        throw new Error(`Failed to save updated cover image file: ${filenameForSaving}`)
      }

      // Delete old cover image *only if* the filename actually changed
      // Compare the old stored name with the name used for saving the new file
      if (oldCoverFilename && oldCoverFilename !== filenameForSaving) {
        await deleteCoverFile(oldCoverFilename)
      }
      // Ensure the update data uses the filename we actually saved under
      updateData.cover = filenameForSaving
    } else if (
      finalDecodedNewCoverFilename !== undefined &&
      finalDecodedNewCoverFilename !== oldCoverFilename
    ) {
      // If filename was changed in the form, but no new file uploaded, delete the old file.
      console.warn(
        `Cover filename changed to ${finalDecodedNewCoverFilename}, but no new image file uploaded. Deleting old file: ${oldCoverFilename}`
      )
      await deleteCoverFile(oldCoverFilename)
      // Ensure updateData reflects the explicitly changed filename
      updateData.cover = finalDecodedNewCoverFilename
    }
    // If neither coverFile nor a new cover filename is provided,
    // updateData.cover remains unset, and the merge below preserves the original.

    // --- Merge Updates & Save ---
    const updatedReleaseData = {
      ...originalRelease,
      ...updateData, // Overwrite with new values where provided
    }
    releasesData[releaseIndex] = updatedReleaseData as Release // Update the array
    await updateReleases(releasesData)

    return NextResponse.json(
      { message: 'Release updated successfully', release: updatedReleaseData },
      { status: 200 }
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
    return NextResponse.json({ message: clientMessage }, { status: statusCode })
  }
}

// DELETE: Delete a release and its associated cover image
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rymIdToDelete = searchParams.get('rymId')

    if (!rymIdToDelete) {
      return NextResponse.json({ message: 'Missing `rymId` query parameter.' }, { status: 400 })
    }

    const releasesData = await getReleases()
    const releaseIndex = releasesData.findIndex((r) => r.rymId === rymIdToDelete)

    if (releaseIndex === -1) {
      return NextResponse.json(
        { message: `Release with rymId '${rymIdToDelete}' not found.` },
        { status: 404 }
      )
    }

    const releaseToDelete = releasesData[releaseIndex]
    const coverFilenameToDelete = releaseToDelete.cover
    const filteredReleases = releasesData.filter((_, index) => index !== releaseIndex)

    await updateReleases(filteredReleases)
    await deleteCoverFile(coverFilenameToDelete)

    return NextResponse.json(
      {
        message: `Release with rymId '${rymIdToDelete}' deleted successfully.`,
      },
      { status: 200 }
    )
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
    // TODO
    const clientMessage = 'An internal server error occurred while deleting the release.'
    return NextResponse.json({ message: clientMessage }, { status: statusCode })
  }
}

// Setting 'force-static' seems incorrect for dynamic API routes that modify data.
export const dynamic = 'force-static'
// It should likely be 'auto' (default) or 'force-dynamic' if reads need to be fresh.
// Given the file writing, it cannot be truly static.
