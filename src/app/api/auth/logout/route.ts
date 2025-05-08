import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const cookieStore = await cookies()

    cookieStore.delete('admin-session')

    return Response.json({ message: 'Logout successful' }, { status: 200 })
  } catch (error) {
    let errorMessage = 'An unexpected error occurred during logout.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/logout route handler:', error)
    return Response.json({ message: errorMessage }, { status: 500 })
  }
}
