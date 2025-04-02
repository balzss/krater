import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { releases } from '@/lib/releases' // Adjust path if necessary
import { artists } from '@/lib/artists' // Adjust path if necessary

export const dynamic = 'force-static'

export async function GET() {
  try {
    // --- Data Preparation ---

    // 1. Get actual cover filenames present in the public/covers directory
    const coversDir = path.join(process.cwd(), 'public', 'covers')
    let actualCoverFiles: string[] = []
    try {
      actualCoverFiles = fs.readdirSync(coversDir)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Handle case where the directory might not exist
      if (error.code === 'ENOENT') {
        console.warn(`Health Check: Covers directory not found at ${coversDir}`)
      } else {
        console.error('Health Check: Error reading covers directory:', error)
        throw error // Re-throw for a 500 error
      }
    }

    // 2. Create a Set of NORMALIZED actual filenames for efficient lookup
    const actualNormalizedCoverFiles = new Set(
      actualCoverFiles.map((fileName) => fileName.normalize('NFC')) // Normalize actual filenames
    )

    // 3. Create a Set of DECODED and NORMALIZED cover names referenced in releases.ts
    const referencedDecodedNormalizedCovers = new Set<string>()
    const malformedUris: string[] = [] // Keep track of strings that fail decoding

    releases.forEach((release) => {
      try {
        // Decode the URL-encoded string, then normalize
        const decoded = decodeURIComponent(release.cover)
        referencedDecodedNormalizedCovers.add(decoded.normalize('NFC'))
      } catch (_e) {
        // Handle potential URIError if a string is not valid percent-encoding
        console.warn(
          `Health Check: Malformed URI component in releases.ts cover field: "${release.cover}" for title "${release.title}"`
        )
        malformedUris.push(release.cover)
        // Decide how to handle this - perhaps add the raw string if needed?
        // For now, we just log it and it won't be in the set.
      }
    })

    // 4. Get all artist rymIds referenced in releases.ts
    const referencedArtistRymIds = new Set(releases.flatMap((release) => release.artistRymIds))

    // 5. Get all artist rymIds defined in artists.ts
    const definedArtistRymIds = new Set(artists.map((artist) => artist.rymId))

    // --- Perform Checks ---

    // Check 1: Find images in public/covers not referenced in releases.ts
    // Check if the normalized actual filename exists in the set of decoded+normalized referenced names
    const unusedCovers = actualCoverFiles.filter(
      (fileName) => !referencedDecodedNormalizedCovers.has(fileName.normalize('NFC'))
    )

    // Check 2: Find artists defined in artists.ts but not referenced in any release
    const unusedArtists = artists
      .filter((artist) => !referencedArtistRymIds.has(artist.rymId))
      .map((artist) => ({ rymId: artist.rymId, displayName: artist.displayName }))

    // Check 3: Find missing cover images (referenced in releases but seems missing on disk)
    // For each release, decode+normalize its cover string and check if THAT exists among actual files
    const missingCovers = releases
      .filter((release) => {
        // Skip check if the original URI was malformed
        if (malformedUris.includes(release.cover)) return false

        try {
          const decodedNormalized = decodeURIComponent(release.cover).normalize('NFC')
          // Check if this decoded+normalized version exists in the set of actual normalized files
          return !actualNormalizedCoverFiles.has(decodedNormalized)
        } catch (_e) {
          // Should have been caught already, but defensive check
          return true // Report as missing if decoding fails here unexpectedly
        }
      })
      .map((release) => ({ title: release.title, cover: release.cover })) // Report the original URL-like name from releases.ts

    // Check 4: Find artists referenced in releases but not defined in artists.ts
    const missingArtists = [...referencedArtistRymIds]
      .filter((artistRymId) => !definedArtistRymIds.has(artistRymId))
      .map((rymId) => {
        const referencingReleases = releases
          .filter((r) => r.artistRymIds.includes(rymId))
          .map((r) => r.title)
        return { rymId, referencedIn: referencingReleases }
      })

    // --- Return Response ---
    return NextResponse.json({
      status: 'ok',
      issues: {
        unusedCovers,
        unusedArtists,
        missingCovers,
        missingArtists,
        // Optionally report malformed URIs found during decoding
        // malformedCoverUris: malformedUris
      },
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health Check API Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error during health check.' },
      { status: 500 }
    )
  }
}
