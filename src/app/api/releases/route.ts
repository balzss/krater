import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { releases as initialReleases, type Release } from '@/lib/releases'

const releasesFilePath = path.join(process.cwd(), 'src', 'lib', 'releases.ts')
const coversDir = path.join(process.cwd(), 'public', 'covers')

/*
 * =============================================================================
 * 🚨 WARNING: Modifying source code files directly from an API is unconventional and risky! 🚨
 * (Same warnings apply as for the /api/artists route regarding concurrency, builds, etc.)
 * =============================================================================
 */

// Helper: Ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      // Directory already exists, which is fine.
      return
    }
    console.error(`Error creating directory ${dirPath}:`, error)
    throw new Error(`Could not create directory: ${dirPath}`)
  }
}

// Helper: Reads the raw content of the releases.ts file.
async function readReleasesFileContent(): Promise<string> {
  try {
    return await fs.readFile(releasesFilePath, 'utf-8')
  } catch (error: unknown) {
    console.error('Error reading releases file:', error)
    throw new Error('Could not read releases data file.')
  }
}

// Helper: Writes the releases array back to the TS file.
async function writeReleasesToFile(releases: Release[]): Promise<void> {
  const fileContent = await readReleasesFileContent()
  const startMarker = 'export const releases: Release[] = ['
  const endMarker = ']'
  const startIndex = fileContent.indexOf(startMarker)
  const endIndex = fileContent.lastIndexOf(endMarker, fileContent.length)

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.error(
      `File parsing markers not found correctly. Start index: ${startIndex}, End index: ${endIndex}`
    )
    throw new Error('Could not find releases array definition markers in src/lib/releases.ts.')
  }

  let newArrayString = '\n'
  releases.forEach((release) => {
    const { title, rymId, cover } = release
    const rymUrl = release.rymUrl ? `'${release.rymUrl.replace(/'/g, "\\'")}'` : undefined
    const artistRymIdsString = `[${release.artistRymIds.map((id) => `\`${id}\``).join(', ')}]`

    const mediaEntries = Object.entries(release.media).map(([key, value]) => {
      const formattedValue = `\`${value}\``
      return `      ${key}: ${formattedValue}`
    })
    const mediaString = `{\n${mediaEntries.join(',\n')},\n    }` // Indentation for closing brace

    newArrayString += `  {\n`
    newArrayString += `    artistRymIds: ${artistRymIdsString},\n`
    newArrayString += `    title: \`${title}\`,\n`
    newArrayString += `    rymId: \`${rymId}\`,\n`
    if (rymUrl) newArrayString += `    rymUrl: ${rymUrl},\n`
    newArrayString += `    cover: \`${cover}\`,\n`
    newArrayString += `    media: ${mediaString.trimStart()},\n` // Add media objec
    newArrayString += `  },`
    newArrayString += '\n'
  })

  const newFileContent =
    fileContent.substring(0, startIndex + startMarker.length) +
    newArrayString +
    fileContent.substring(endIndex)

  try {
    await fs.writeFile(releasesFilePath, newFileContent, 'utf-8')
  } catch (error: unknown) {
    console.error('Error writing releases file:', error)
    throw new Error('Could not write releases data file.')
  }
}

// Helper: Delete cover file safely
async function deleteCoverFile(filename: string | undefined | null) {
  if (!filename) return // No filename, nothing to delete
  try {
    const filePath = path.join(coversDir, filename)
    await fs.unlink(filePath)
    console.log(`Deleted cover file: ${filePath}`)
  } catch (error: unknown) {
    // If file doesn't exist, ignore error, otherwise log it
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      console.error(`Error deleting cover file ${filename}:`, error)
      // Decide if this should throw or just warn
    }
  }
}

export const dynamic = 'force-static'

// --- API Route Handlers ---

// GET: Return all releases
export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json(initialReleases)
  } catch (error: unknown) {
    console.error('[API RELEASES GET] Error:', error)
    return NextResponse.json({ message: 'Failed to fetch releases' }, { status: 500 })
  }
}

// POST: Add a new release with optional cover image upload
export async function POST(req: NextRequest) {
  try {
    await ensureDirectoryExists(coversDir) // Ensure public/covers exists

    // Use formData to handle potential file uploads
    const formData = await req.formData()
    const releaseData: Partial<Release> = {}
    let coverFile: File | null = null
    let coverFilename = ''

    // Extract fields from formData
    // Non-file fields often come as strings, need parsing
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'coverImage') {
          // Assuming client sends file under this key
          coverFile = value
        }
      } else {
        // Assign simple string fields directly
        if (key === 'title' || key === 'rymId' || key === 'rymUrl' || key === 'cover') {
          releaseData[key] = value
        }
        // Parse complex fields (assuming they are sent as JSON strings)
        else if (key === 'artistRymIds') {
          try {
            releaseData.artistRymIds = JSON.parse(value)
          } catch {
            throw new Error('Invalid JSON format for artistRymIds')
          }
        } else if (key === 'media') {
          try {
            releaseData.media = JSON.parse(value)
          } catch {
            throw new Error('Invalid JSON format for media')
          }
        }
      }
    }

    // --- Validation ---
    if (
      !releaseData.title ||
      !releaseData.rymId ||
      !releaseData.artistRymIds ||
      !releaseData.cover ||
      !releaseData.media
    ) {
      throw new Error(
        'Missing required fields: title, rymId, artistRymIds, cover (filename), media'
      )
    }
    if (initialReleases.some((r) => r.rymId === releaseData.rymId)) {
      throw new Error(`Release with rymId ${releaseData.rymId} already exists.`)
    }
    if (!Array.isArray(releaseData.artistRymIds) || releaseData.artistRymIds.length === 0) {
      throw new Error('artistRymIds must be a non-empty array.')
    }
    coverFilename = releaseData.cover // Use the filename provided in the 'cover' field

    // --- Handle Image Upload ---
    if (coverFile) {
      if (coverFile.size === 0) throw new Error('Cover image file cannot be empty.')
      // Consider adding more validation: file type, size limits
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      const savePath = path.join(coversDir, coverFilename)
      await fs.writeFile(savePath, buffer)
      console.log(`Saved new cover: ${savePath}`)
    } else {
      // Optional: Check if a cover filename was provided but no file was uploaded
      console.warn(
        `No cover image file uploaded for cover filename: ${coverFilename}. Ensure file exists manually or upload one.`
      )
    }

    // --- Create and Save Release Data ---
    const newRelease: Release = {
      title: releaseData.title,
      rymId: releaseData.rymId,
      artistRymIds: releaseData.artistRymIds,
      cover: coverFilename, // Store the filename
      media: releaseData.media,
      rymUrl: releaseData.rymUrl, // Optional
    }

    const currentReleases = [...initialReleases]
    currentReleases.push(newRelease)
    await writeReleasesToFile(currentReleases)

    return NextResponse.json(
      { message: 'Release added successfully', release: newRelease },
      { status: 201 }
    )
  } catch (error: unknown) {
    let errorMessage = 'Failed to add release.'
    let statusCode = 500
    if (error instanceof Error) {
      errorMessage = error.message
      // Check for specific validation errors to return 400 Bad Request
      if (
        errorMessage.startsWith('Missing required') ||
        errorMessage.startsWith('Invalid JSON') ||
        errorMessage.includes('already exists')
      ) {
        statusCode = 400
      } else if (
        errorMessage.includes('Could not write') ||
        errorMessage.includes('Could not read') ||
        errorMessage.includes('Could not create directory')
      ) {
        statusCode = 500 // Keep 500 for server/file system errors
      }
      console.error(`[API RELEASES POST] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API RELEASES POST] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    return NextResponse.json({ message: errorMessage }, { status: statusCode })
  }
}

// PUT: Update an existing release, optionally updating/replacing the cover image
export async function PUT(req: NextRequest) {
  try {
    await ensureDirectoryExists(coversDir)
    const formData = await req.formData()
    const updateData: Partial<Release> & { targetRymId?: string } = {} // Add targetRymId or get from query/path
    let coverFile: File | null = null
    let newCoverFilename: string | undefined = undefined // Explicitly track if cover filename is being updated

    // --- Extract Data ---
    // Need a way to identify the release to update, e.g., from a field 'targetRymId' in the form
    if (!formData.has('targetRymId')) {
      throw new Error("Missing 'targetRymId' field in form data to identify the release to update.")
    }
    updateData.targetRymId = formData.get('targetRymId') as string

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'coverImage') coverFile = value
      } else {
        if (key === 'targetRymId') continue // Already handled
        if (key === 'title' || key === 'rymId' || key === 'rymUrl' || key === 'cover') {
          updateData[key] = value
          if (key === 'cover') newCoverFilename = value // Track the new desired filename
        } else if (key === 'artistRymIds') {
          try {
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

    // --- Find Existing Release ---
    const currentReleases = [...initialReleases]
    const releaseIndex = currentReleases.findIndex((r) => r.rymId === updateData.targetRymId)
    if (releaseIndex === -1) {
      return NextResponse.json(
        { message: `Release with rymId ${updateData.targetRymId} not found.` },
        { status: 404 }
      )
    }
    const originalRelease = currentReleases[releaseIndex]
    const oldCoverFilename = originalRelease.cover // Store original filename for potential deletion

    // --- Handle Image Update ---
    if (coverFile) {
      if (!newCoverFilename) {
        // If file is uploaded but no new cover filename is specified in the form, use the existing one.
        // OR potentially throw error? Let's use existing for now.
        console.warn(
          "New cover image uploaded, but no new 'cover' filename field provided. Using existing filename."
        )
        newCoverFilename = oldCoverFilename
      }
      // Consider adding more validation: file type, size limits
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      const savePath = path.join(coversDir, newCoverFilename)
      await fs.writeFile(savePath, buffer)
      console.log(`Saved updated cover: ${savePath}`)

      // Delete old cover image *only if* the filename actually changed
      if (oldCoverFilename && oldCoverFilename !== newCoverFilename) {
        await deleteCoverFile(oldCoverFilename)
      }
      // Update the cover filename for the data to be saved
      updateData.cover = newCoverFilename
    } else if (newCoverFilename !== undefined && newCoverFilename !== oldCoverFilename) {
      // If cover filename is changed, but no new file uploaded, delete the old file associated with the old name
      console.warn(
        `Cover filename changed to ${newCoverFilename}, but no new image file uploaded. Deleting old file: ${oldCoverFilename}`
      )
      await deleteCoverFile(oldCoverFilename)
      updateData.cover = newCoverFilename // Ensure the data reflects the new filename
    }
    // If neither coverFile nor newCoverFilename is provided, updateData.cover remains undefined,
    // so the original cover filename will be preserved in the merge below.

    // --- Merge Updates & Save ---
    // Important: Merge updateData onto originalRelease to preserve fields not being updated
    const updatedRelease = {
      ...originalRelease,
      ...updateData, // Overwrite with new values where provided
    }
    // Remove the temporary targetRymId field before saving
    delete updatedRelease.targetRymId

    currentReleases[releaseIndex] = updatedRelease as Release // Update the array
    await writeReleasesToFile(currentReleases)

    return NextResponse.json(
      { message: 'Release updated successfully', release: updatedRelease },
      { status: 200 }
    )
  } catch (error: unknown) {
    // Similar error handling as POST
    let errorMessage = 'Failed to update release.'
    let statusCode = 500
    if (error instanceof Error) {
      errorMessage = error.message
      if (errorMessage.startsWith('Missing') || errorMessage.startsWith('Invalid JSON')) {
        statusCode = 400
      } else if (
        errorMessage.includes('Could not write') ||
        errorMessage.includes('Could not read') ||
        errorMessage.includes('Could not create directory')
      ) {
        statusCode = 500
      }
      console.error(`[API RELEASES PUT] Error: ${errorMessage}`, error.stack)
    } else {
      console.error('[API RELEASES PUT] Non-Error thrown:', error)
      errorMessage = 'An unexpected server error occurred.'
    }
    return NextResponse.json({ message: errorMessage }, { status: statusCode })
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

    const currentReleases = [...initialReleases]
    const releaseIndex = currentReleases.findIndex((r) => r.rymId === rymIdToDelete)

    if (releaseIndex === -1) {
      return NextResponse.json(
        { message: `Release with rymId '${rymIdToDelete}' not found.` },
        { status: 404 }
      )
    }

    const releaseToDelete = currentReleases[releaseIndex]
    const coverFilenameToDelete = releaseToDelete.cover

    // Filter out the release
    const filteredReleases = currentReleases.filter((_, index) => index !== releaseIndex)

    // Write updated data file *first* in case file deletion fails
    await writeReleasesToFile(filteredReleases)

    // Delete associated cover image file
    await deleteCoverFile(coverFilenameToDelete)

    return NextResponse.json(
      {
        message: `Release with rymId '${rymIdToDelete}' deleted successfully.`,
        artists: filteredReleases,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    // Similar error handling as others
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
    return NextResponse.json({ message: errorMessage }, { status: statusCode })
  }
}
