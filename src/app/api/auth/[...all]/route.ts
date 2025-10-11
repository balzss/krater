import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Tell Next.js this route can't be statically analyzed
export const dynamic = 'force-dynamic'

export const { GET, POST } = toNextJsHandler(auth)
