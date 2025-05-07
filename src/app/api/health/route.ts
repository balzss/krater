import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getLibraryData } from '@/lib/server'

export const dynamic = 'force-dynamic'

export type HealthIssues = {
  unusedCovers: string[]
  unusedArtists: {
    rymId: string
    displayName: string
  }[]
  missingCovers: {
    releaseTitle: string
    releaseArtists: string
    filename: string
    rymId: string
    rymUrl?: string
  }[]
  missingArtists: {
    rymId: string
    referencedIn: string[]
  }[]
}

export async function GET() {
  try {
    const libraryData = await getLibraryData()
    const { releases, artists } = libraryData
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
    const unusedCovers = coverFiles.filter((filename) => !referencedCovers.includes(filename))

    // Check 2: Find artists defined in artists.ts but not referenced in any release
    const unusedArtists = artists
      .filter((artist) => !referencedArtistRymIds.includes(artist.rymId))
      .map(({ rymId, displayName }) => ({ rymId, displayName }))

    // Check 3: Find missing cover images (referenced in releases but seems missing on disk)
    const missingCovers = releases
      .filter((release) => !coverFiles.includes(release.cover))
      .map(({ title, cover, rymId, rymUrl, artistRymIds }) => ({
        releaseTitle: title,
        filename: cover,
        releaseArtists: artistRymIds
          .map((artistRymId) => artists.find((a) => a.rymId === artistRymId)?.displayName)
          .join(', '),
        rymId,
        rymUrl,
      }))

    // Check 4: Find artists referenced in releases but not defined in artists.ts
    const missingArtists = referencedArtistRymIds
      .filter((artistRymId) => !definedArtistRymIds.includes(artistRymId))
      .map((rymId) => {
        const referencingReleases = releases
          .filter((r) => r.artistRymIds.includes(rymId))
          .map((r) => r.title)
        return { rymId, referencedIn: referencingReleases }
      })

    const issues: HealthIssues = {
      unusedCovers,
      unusedArtists,
      missingCovers,
      missingArtists,
    }
    return NextResponse.json({
      status: 'ok',
      issues,
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
