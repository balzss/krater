import { getLibraryData, setLibraryData } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'
import { requireAuth } from '@/lib/auth-helpers'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const libraryData = await getLibraryData()
    return successResponse({
      libraryData,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Library data API Error:', error)
    return errorResponse('Internal Server Error during getting library data.')
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const { response: authResponse } = await requireAuth(request)
  if (authResponse) return authResponse

  try {
    const receivedData = await request.json()

    if (!receivedData) {
      return errorResponse('No data received in request body.', 400)
    }

    await setLibraryData(receivedData)
    console.log(`Data successfully processed by writeDataJson.`)

    return successResponse({
      message: 'Data saved successfully.',
      savedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Library data POST API Error:', error)

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON format in request body.', 400)
    }

    return errorResponse('Internal Server Error during saving data.')
  }
}
