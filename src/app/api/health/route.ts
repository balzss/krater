import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { releases, artists } from '@/lib/data'

export const dynamic = 'force-static'

export async function GET() {
  try {
    const coversDir = path.join(process.cwd(), 'public', 'covers')
    let coverFiles: string[] = []
    try {
      coverFiles = fs.readdirSync(coversDir)

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

    // TODO: check for multiple usages of the same cover
    const referencedCovers = releases.map((release) => release.cover)
    const referencedArtistRymIds = releases.flatMap((release) => release.artistRymIds)
    // TODO: check for duplicated artists in artists.ts
    const definedArtistRymIds = artists.map((artist) => artist.rymId)

    // Check 1: Find images in public/covers not referenced in releases.ts
    const unusedCovers = coverFiles.filter((fileName) => !referencedCovers.includes(fileName))

    // Check 2: Find artists defined in artists.ts but not referenced in any release
    const unusedArtists = artists
      .filter((artist) => !referencedArtistRymIds.includes(artist.rymId))
      .map(({ rymId, displayName }) => ({ rymId, displayName }))

    // Check 3: Find missing cover images (referenced in releases but seems missing on disk)
    const missingCovers = releases
      .filter((release) => !coverFiles.includes(release.cover))
      .map(({ title, cover, rymId, rymUrl }) => ({ title, cover, rymId, rymUrl })) // Report the original URL-like name from releases.ts

    // Check 4: Find artists referenced in releases but not defined in artists.ts
    const missingArtists = referencedArtistRymIds
      .filter((artistRymId) => !definedArtistRymIds.includes(artistRymId))
      .map((rymId) => {
        const referencingReleases = releases
          .filter((r) => r.artistRymIds.includes(rymId))
          .map((r) => r.title)
        return { rymId, referencedIn: referencingReleases }
      })

    return NextResponse.json({
      status: 'ok',
      issues: {
        unusedCovers,
        unusedArtists,
        missingCovers,
        missingArtists,
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
