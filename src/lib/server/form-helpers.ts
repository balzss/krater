import fs from 'fs/promises'
import path from 'path'
import type { Release } from '@/lib/data'

/**
 * Parsed release data from form submission
 */
export interface ParsedReleaseData {
  releaseData: Partial<Release>
  coverFile: File | null
  coverFilename: string
}

/**
 * Normalizes a cover filename by decoding URI encoding and normalizing Unicode to NFC form
 * @param raw - Raw filename string from form data
 * @returns Decoded and normalized filename
 * @throws Error if filename is missing or invalid
 */
export function normalizeCoverFilename(raw: string | undefined): string {
  if (!raw) {
    throw new Error("Missing required 'cover' field (filename) in form data.")
  }

  try {
    const decoded = decodeURIComponent(raw).normalize('NFC')
    if (!decoded) {
      throw new Error('Cover filename cannot be empty after decoding.')
    }
    return decoded
  } catch (e) {
    if (e instanceof URIError) {
      throw new Error(`Malformed 'cover' filename provided: ${raw}`)
    }
    throw e
  }
}

/**
 * Parses form data for a release (used in POST requests)
 * @param formData - FormData from request
 * @returns Parsed release data including cover file and normalized filename
 * @throws Error if required fields are missing or invalid
 */
export async function parseReleaseFormData(formData: FormData): Promise<ParsedReleaseData> {
  const releaseData: Partial<Release> = {}
  let coverFile: File | null = null
  let rawCoverFilename: string | undefined = undefined

  // Extract fields
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (key === 'coverImage') coverFile = value
    } else {
      if (key === 'title' || key === 'rymId' || key === 'rymUrl') {
        releaseData[key] = value
      } else if (key === 'cover') {
        rawCoverFilename = value
      } else if (key === 'artistRymIds') {
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

  // Normalize cover filename
  const coverFilename = normalizeCoverFilename(rawCoverFilename)
  releaseData.cover = coverFilename

  return { releaseData, coverFile, coverFilename }
}

/**
 * Parses form data for a release update (used in PUT requests)
 * @param formData - FormData from request
 * @returns Parsed release data including cover file and optional new normalized filename
 * @throws Error if rymId is missing or invalid
 */
export async function parseUpdateFormData(formData: FormData): Promise<ParsedReleaseData & { rymId: string }> {
  // Validate rymId presence first
  if (!formData.has('rymId')) {
    throw new Error("Missing 'rymId' field in form data to identify the release to update.")
  }

  const releaseData: Partial<Release> = {}
  let coverFile: File | null = null
  let rawNewCoverFilename: string | undefined = undefined
  let coverFilename = ''

  releaseData.rymId = formData.get('rymId') as string
  const rymId = releaseData.rymId

  // Extract fields
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (key === 'coverImage') coverFile = value
    } else {
      if (key === 'rymId') continue // Already extracted
      if (key === 'title' || key === 'rymUrl') {
        releaseData[key] = value
      } else if (key === 'cover') {
        rawNewCoverFilename = value
      } else if (key === 'artistRymIds') {
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

  // Normalize cover filename if provided
  if (rawNewCoverFilename !== undefined) {
    coverFilename = normalizeCoverFilename(rawNewCoverFilename)
    releaseData.cover = coverFilename
  }

  return { releaseData, coverFile, coverFilename, rymId }
}

/**
 * Saves a cover file to the specified directory
 * @param file - File to save
 * @param filename - Normalized filename to save as
 * @param targetDir - Directory to save file in
 * @throws Error if file is empty or write fails
 */
export async function saveCoverFile(file: File, filename: string, targetDir: string): Promise<void> {
  if (file.size === 0) {
    throw new Error('Cover image file cannot be empty.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const savePath = path.join(targetDir, filename)

  try {
    await fs.writeFile(savePath, buffer)
  } catch (writeError) {
    console.error(`Error writing cover file ${savePath}:`, writeError)
    throw new Error(`Failed to save cover image file: ${filename}`)
  }
}

/**
 * Validates required fields for a new release
 * @param releaseData - Partial release data to validate
 * @throws Error if required fields are missing or invalid
 */
export function validateNewRelease(releaseData: Partial<Release>): void {
  if (
    !releaseData.title ||
    !releaseData.rymId ||
    !releaseData.artistRymIds ||
    !releaseData.media
  ) {
    throw new Error('Missing required fields: title, rymId, artistRymIds, media')
  }

  if (!Array.isArray(releaseData.artistRymIds) || releaseData.artistRymIds.length === 0) {
    throw new Error('artistRymIds must be a non-empty array.')
  }
}

/**
 * Checks if a release with the given rymId already exists
 * @param releases - Array of existing releases
 * @param rymId - rymId to check
 * @throws Error if release already exists
 */
export function checkDuplicateRelease(releases: Release[], rymId: string): void {
  if (releases.some((r) => r.rymId === rymId)) {
    throw new Error(`Release with rymId ${rymId} already exists.`)
  }
}
