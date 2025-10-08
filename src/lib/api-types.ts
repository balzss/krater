/**
 * Standard API response types for consistent error handling and data structures
 */

export type ApiResponse<T = unknown> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string; [key: string]: unknown }

export type SuccessResponse<T> = Extract<ApiResponse<T>, { status: 'ok' }>
export type ErrorResponse = Extract<ApiResponse, { status: 'error' }>
