import { NextRequest, NextResponse } from 'next/server'
import { artists, Artist } from '@/lib/artists'
import fs from 'fs'
import path from 'path'

// Path to the artists.ts file (for saving changes)
const filePath = path.join(process.cwd(), 'src/lib/artists.ts')

// Function to save updated artists data (no semicolons, single quotes, no quotes for keys)
function saveArtists(artists: Artist[]) {
  const content = `export type Artist = {
  displayName: string
  rymId: string
  rymUrl?: string
}

export const artists: Artist[] = [
${artists
  .map(
    (artist) => `  {
    displayName: '${artist.displayName}',
    rymId: '${artist.rymId}'${
      artist.rymUrl
        ? `,
    rymUrl: '${artist.rymUrl}',`
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

    // Work directly with the imported artists data
    let currentArtists = [...artists] // Create a copy of the current artists list

    if (body.removeRymId) {
      // 🔹 Remove artist by rymId
      const initialLength = currentArtists.length
      currentArtists = currentArtists.filter((artist) => artist.rymId !== body.removeRymId)

      if (currentArtists.length === initialLength) {
        return NextResponse.json({ message: 'Artist not found' }, { status: 404 })
      }
    } else if (body.addArtist) {
      // 🔹 Add a new artist if it doesn’t exist
      const newArtist = body.addArtist

      if (typeof newArtist.rymId !== 'string' || typeof newArtist.displayName !== 'string') {
        return NextResponse.json({ message: 'Invalid artist format.' }, { status: 400 })
      }

      // Check if the artist already exists in the current list
      if (currentArtists.some((artist) => artist.rymId === newArtist.rymId)) {
        return NextResponse.json({ message: 'Artist already exists' }, { status: 409 })
      }

      // Add new artist to the list
      currentArtists.push(newArtist)
    } else if (Array.isArray(body)) {
      // 🔹 Replace the entire artists array (optional behavior)
      if (!body.every((a) => typeof a.rymId === 'string' && typeof a.displayName === 'string')) {
        return NextResponse.json(
          { message: 'Invalid data format. Expected an array of artist objects.' },
          { status: 400 }
        )
      }
      currentArtists = body
    } else {
      return NextResponse.json({ message: 'Invalid request format' }, { status: 400 })
    }

    // Save updated artists list to the file
    saveArtists(currentArtists)
    return NextResponse.json(
      { message: 'Artists updated successfully', artists: currentArtists },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating artists:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
