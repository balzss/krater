import { NextRequest } from 'next/server'
import { deleteCoverFile } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'
import { requireAuth } from '@/lib/auth-helpers'

export async function DELETE(req: NextRequest) {
  // Check authentication
  const { response: authResponse } = await requireAuth(req)
  if (authResponse) return authResponse

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
