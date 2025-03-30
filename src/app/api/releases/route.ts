import { NextRequest, NextResponse } from 'next/server'
import { releases, Release } from '@/lib/releases' // Using @ instead of src
import fs from 'fs'
import path from 'path'

// Path to the releases.ts file (for saving changes)
const filePath = path.join(process.cwd(), 'src/lib/releases.ts')

// Function to save updated releases data (no semicolons, single quotes, no quotes for keys)
function saveReleases(releases: Release[]) {
  const content = `export type Release = {
  artistRymIds: string[]
  title: string
  rymId: string
  rymUrl?: string
  cover: string
  media: {
    spotify?: string
  }
}

export const releases: Release[] = [
${releases
  .map(
    (release) => `  {
    artistRymIds: [${release.artistRymIds.map((id) => `\`${id}\``).join(', ')}],
    title: \`${release.title}\`,
    rymId: \`${release.rymId}\`,
    cover: \`${release.cover}\`${
      release.rymUrl
        ? `,
    rymUrl: \`${release.rymUrl}\``
        : ''
    }${
      release.media.spotify
        ? `,
    media: {
      spotify: \`${release.media.spotify}\`,
    },`
        : ''
    }
  },`
  )
  .join('\n')}
]
`

  fs.writeFileSync(filePath, content, 'utf8')
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    // Work directly with the imported releases data
    let currentReleases = [...releases] // Create a copy of the current releases list

    if (body.removeRymId) {
      // 🔹 Remove release by rymId
      const initialLength = currentReleases.length
      currentReleases = currentReleases.filter((release) => release.rymId !== body.removeRymId)

      if (currentReleases.length === initialLength) {
        return NextResponse.json({ message: 'Release not found' }, { status: 404 })
      }
    } else if (body.addRelease) {
      // 🔹 Add a new release if it doesn’t exist
      const newRelease = body.addRelease

      // Ensure required fields are present (including 'cover' as part of the request)
      if (
        typeof newRelease.rymId !== 'string' ||
        typeof newRelease.title !== 'string' ||
        !Array.isArray(newRelease.artistRymIds) ||
        typeof newRelease.cover !== 'string'
      ) {
        return NextResponse.json(
          { message: 'Invalid release format. Missing required fields.' },
          { status: 400 }
        )
      }

      // Check if the release already exists in the current list
      if (currentReleases.some((release) => release.rymId === newRelease.rymId)) {
        return NextResponse.json({ message: 'Release already exists' }, { status: 409 })
      }

      // Add new release to the list
      currentReleases.push(newRelease)
    } else if (Array.isArray(body)) {
      // 🔹 Replace the entire releases array (optional behavior)
      if (
        !body.every(
          (r) =>
            typeof r.rymId === 'string' &&
            typeof r.title === 'string' &&
            Array.isArray(r.artistRymIds) &&
            typeof r.cover === 'string'
        )
      ) {
        return NextResponse.json(
          { message: 'Invalid data format. Expected an array of release objects.' },
          { status: 400 }
        )
      }
      currentReleases = body
    } else {
      return NextResponse.json({ message: 'Invalid request format' }, { status: 400 })
    }

    // Save updated releases list to the file
    saveReleases(currentReleases)
    return NextResponse.json(
      { message: 'Releases updated successfully', releases: currentReleases },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating releases:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
