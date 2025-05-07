import path from 'path'
import fs from 'fs/promises'
import type { Release, Artist, LibraryData } from '@/lib/data'

const coversDir = path.join(process.cwd(), 'public', 'covers')
const dataJsonPath = path.join(process.cwd(), 'public', 'data', 'libraryData.json')

export { withAuth } from './with-auth'

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

export async function deleteCoverFile(filename: string | undefined | null) {
  if (!filename) return // No filename, nothing to delete
  try {
    const filePath = path.join(coversDir, filename)
    await fs.unlink(filePath)
    console.log(`Deleted cover file: ${filePath}`)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      console.error(`Error deleting cover file ${filename}:`, error)
    }
  }
}

export async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      return // Directory already exists, which is fine.
    }
    console.error(`Error creating directory ${dirPath}:`, error)
    throw new Error(`Could not create directory: ${dirPath}`)
  }
}

export async function getLibraryData(): Promise<LibraryData> {
  try {
    const dataJson = await fs.readFile(dataJsonPath, 'utf8')
    const libraryData = JSON.parse(dataJson)
    return libraryData
  } catch (error: unknown) {
    console.error('Error reading library data file:', error)
    throw new Error('Could not read library data file.')
  }
}

export async function setLibraryData(data: LibraryData): Promise<void> {
  try {
    await ensureDirectoryExists(dataJsonPath)
    const jsonString = JSON.stringify(data, null, 2)
    await fs.writeFile(dataJsonPath, jsonString, 'utf-8')
    console.log(`Data successfully written to ${dataJsonPath} by writeDataJson.`)
  } catch (error) {
    console.error(`Error in writeDataJson writing to ${dataJsonPath}:`, error)
    throw new Error(
      `Failed to write data to JSON file: ${error instanceof Error ? error.message : error}`
    )
  }
}

export async function getReleases(): Promise<Release[]> {
  try {
    const libraryData = await getLibraryData()
    const releasesData = libraryData.releases
    return releasesData
  } catch (error: unknown) {
    console.error('Error getting releases:', error)
    throw new Error('Could not get releases data.')
  }
}

export async function updateReleases(releases: Release[]): Promise<void> {
  try {
    const libraryData = await getLibraryData()
    await setLibraryData({ ...libraryData, releases })
  } catch (error: unknown) {
    console.error('Error reading releases file:', error)
    throw new Error('Could not read releases data file.')
  }
}

export async function getArtists(): Promise<Artist[]> {
  try {
    const libraryData = await getLibraryData()
    return libraryData.artists
  } catch (error: unknown) {
    console.error('Error getting artists:', error)
    throw new Error('Could not get artists data.')
  }
}

export async function updateArtists(artists: Artist[]): Promise<void> {
  try {
    const libraryData = await getLibraryData()
    await setLibraryData({ ...libraryData, artists })
  } catch (error: unknown) {
    console.error('Error updating artists: ', error)
    throw new Error('Could not update artists.')
  }
}
