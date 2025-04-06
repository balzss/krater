import path from 'path'
import fs from 'fs/promises'

const coversDir = path.join(process.cwd(), 'public', 'covers')
const releasesFilePath = path.join(process.cwd(), 'src', 'lib', 'releases.ts')

export async function deleteCoverFile(filename: string | undefined | null) {
  if (!filename) return // No filename, nothing to delete
  try {
    const filePath = path.join(coversDir, filename)
    await fs.unlink(filePath)
    console.log(`Deleted cover file: ${filePath}`)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      // Only log errors other than "file not found"
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

export async function readReleasesFileContent(): Promise<string> {
  try {
    return await fs.readFile(releasesFilePath, 'utf-8')
  } catch (error: unknown) {
    console.error('Error reading releases file:', error)
    throw new Error('Could not read releases data file.')
  }
}
