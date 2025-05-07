import { NextResponse } from 'next/server'
import { getLibraryData, setLibraryData } from '@/lib/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const libraryData = await getLibraryData()
    return NextResponse.json({
      status: 'ok',
      libraryData,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Library data API Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error during getting library data.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const receivedData = await request.json()

    if (!receivedData) {
      return NextResponse.json(
        { status: 'error', message: 'No data received in request body.' },
        { status: 400 }
      )
    }

    await setLibraryData(receivedData)
    console.log(`Data successfully processed by writeDataJson.`)

    return NextResponse.json({
      status: 'ok',
      message: 'Data saved successfully.',
      savedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Library data POST API Error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid JSON format in request body.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error during saving data.' },
      { status: 500 }
    )
  }
}
