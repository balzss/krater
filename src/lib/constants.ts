export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
export const API_BASE_URL = `${BASE_PATH}/api`
export const COVERS_PATH = `${BASE_PATH}/covers`
export const DATA_PATH = `${BASE_PATH}/data`

export const CONFIG = {
  images: {
    priorityLoadCount: 8,
  },
  auth: {
    cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    cookieName: 'admin-session',
  },
  spotify: {
    codeVerifierLength: 128,
    clientId: '47802db6dc5249cbaa5dba475f04cc4d',
  },
} as const
