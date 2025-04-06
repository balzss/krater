import { NextRequest, NextResponse } from 'next/server'
import { deleteCoverFile } from '@/lib/server'

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const coverToDelete = searchParams.get('filename')
    await deleteCoverFile(coverToDelete)

    return NextResponse.json(
      {
        message: `Cover with filename '${coverToDelete}' deleted successfully.`,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    let errorMessage = 'Failed to delete cover.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error(errorMessage)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
