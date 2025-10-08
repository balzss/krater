import { NextRequest } from 'next/server'
import { deleteCoverFile } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const coverToDelete = searchParams.get('filename')
    await deleteCoverFile(coverToDelete)

    return successResponse({
      message: `Cover with filename '${coverToDelete}' deleted successfully.`,
    })
  } catch (error: unknown) {
    let errorMessage = 'Failed to delete cover.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error(errorMessage)
    return errorResponse(errorMessage)
  }
}
