import { NextResponse } from 'next/server'

export function errorResponse(
  message: string,
  statusCode: number = 500,
  additionalData?: Record<string, unknown>
) {
  return NextResponse.json(
    { status: 'error', message, ...additionalData },
    { status: statusCode }
  )
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200
) {
  return NextResponse.json(
    { status: 'ok', ...data },
    { status: statusCode }
  )
}
