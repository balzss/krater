# Implementation Plan

This document provides detailed implementation guidance for roadmap items in `ROADMAP.md`. Each task includes context, files to modify, and specific implementation steps for a coding agent.

## 🚨 Important Guidelines for AI Agents

1. **Use Playwright MCP for ALL user-facing changes** - Navigate, interact, screenshot, and verify before marking tasks complete
2. **Ask for help when stuck** - If spending >30 minutes without progress or stuck in a loop, STOP and ask the human supervisor
3. **Watch for checkpoints** - Implementation steps marked with ⚠️ are critical points where you should pause if issues arise
4. **Use subagents to parallelize work** - When tasks are clearly separated and independent, launch subagents to work in parallel (see guidelines below)

---

## Task 1: Performance Optimization - Lazy Load Images on Browse Page ✅

**Status:** ✅ COMPLETED (Commit: c454fa4)
**Priority:** High
**Complexity:** Medium
**Files:** `src/app/browse/browse-content.tsx`, `src/lib/constants.ts`

### Problem
Browse page loads all images simultaneously. Users should see above-the-fold images first for smoother UX.

### Current State
- Line 105 in `browse-content.tsx`: `priority={index < CONFIG.images.priorityLoadCount}`
- `CONFIG.images.priorityLoadCount` is 8 (line 48 in `constants.ts`)
- All images render immediately in grid

### Solution
Implement progressive image loading based on viewport position.

### Implementation Steps

1. **Calculate viewport threshold:**
   - Determine grid layout (standard vs compact)
   - Standard: 1-4 columns depending on breakpoint
   - Compact: 2-8 columns depending on breakpoint
   - Estimate 1.5 viewports worth of images for priority load

2. **Update priority load count in `src/lib/constants.ts`:**
   ```typescript
   images: {
     priorityLoadCount: 16, // Increased from 8 to cover ~1.5 viewports
   }
   ```

3. **Verify Next.js Image lazy loading:**
   - Non-priority images automatically use `loading="lazy"`
   - No additional changes needed in component
   - Next.js Image handles intersection observer internally

4. **Test with network throttling:**
   - Use Chrome DevTools → Network → Slow 3G
   - Verify priority images load first
   - Verify below-fold images load as user scrolls

### Testing
- Test both compact and standard layouts
- Test on mobile (320px), tablet (768px), desktop (1920px)
- Verify scroll experience is smooth
- Check network waterfall shows staggered loading

**Playwright MCP Verification:**
- Use browser MCP to navigate to `/browse`
- Take screenshots at different scroll positions
- Verify images load progressively as you scroll
- Test in both standard and compact layouts

---

## Task 2: Investigate - Optimize Layout State Fetching ✅

**Status:** ✅ COMPLETED (Commit: 9bdbbba)
**Priority:** Medium
**Complexity:** Medium
**Files:** Create `src/contexts/layout-context.tsx`, modify `src/app/layout.tsx`, modify `src/hooks/use-layout.ts`

### Problem
`useLayout()` hook reads from localStorage on every page load. Should initialize once at app level and provide via context.

### Current State
- `src/hooks/use-layout.ts:11-19` reads localStorage in useEffect on every mount
- `src/app/browse/browse-content.tsx:14` calls useLayout() directly

### Solution
Create React Context Provider to manage layout state globally.

### Implementation Steps

1. **Create `src/contexts/layout-context.tsx`:**
   ```typescript
   'use client'

   import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

   type LayoutMode = 'standard' | 'compact'

   interface LayoutContextType {
     layout: LayoutMode
     setLayoutMode: (mode: LayoutMode) => void
     toggleLayout: () => void
     isLoaded: boolean
   }

   const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

   const LAYOUT_STORAGE_KEY = 'krater-layout'

   export function LayoutProvider({ children }: { children: ReactNode }) {
     const [layout, setLayoutState] = useState<LayoutMode>('standard')
     const [isLoaded, setIsLoaded] = useState(false)

     useEffect(() => {
       if (typeof window !== 'undefined') {
         const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
         if (stored === 'compact' || stored === 'standard') {
           setLayoutState(stored)
         }
         setIsLoaded(true)
       }
     }, [])

     const setLayoutMode = useCallback((mode: LayoutMode) => {
       setLayoutState(mode)
       if (typeof window !== 'undefined') {
         localStorage.setItem(LAYOUT_STORAGE_KEY, mode)
       }
     }, [])

     const toggleLayout = useCallback(() => {
       setLayoutMode(layout === 'standard' ? 'compact' : 'standard')
     }, [layout, setLayoutMode])

     return (
       <LayoutContext.Provider value={{ layout, setLayoutMode, toggleLayout, isLoaded }}>
         {children}
       </LayoutContext.Provider>
     )
   }

   export function useLayoutContext() {
     const context = useContext(LayoutContext)
     if (context === undefined) {
       throw new Error('useLayoutContext must be used within LayoutProvider')
     }
     return context
   }
   ```

2. **Update `src/app/layout.tsx`:**
   ```typescript
   import { LayoutProvider } from '@/contexts/layout-context'

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <body>
           <Providers>
             <LayoutProvider>
               {children}
             </LayoutProvider>
           </Providers>
         </body>
       </html>
     )
   }
   ```

3. **Update `src/hooks/use-layout.ts`:**
   ```typescript
   'use client'

   export { useLayoutContext as useLayout } from '@/contexts/layout-context'
   ```

4. **Verify no other files import or use layout hook directly**

5. **Test navigation between pages:**
   - Verify localStorage read only once on app mount
   - Verify layout state persists across navigation
   - Verify toggle still works

### Testing
- Navigate between pages (home → browse → settings → browse)
- Open DevTools console to verify no repeated localStorage access
- Test layout toggle functionality
- Verify no hydration mismatches

**Playwright MCP Verification:**
- Navigate between pages and verify layout persists
- Toggle layout in settings
- Navigate to browse page and verify layout changed
- Check browser console for localStorage access patterns

---

## Task 3: Improvement - Add Pointer Cursor to Modal Action Buttons ✅

**Status:** ✅ COMPLETED (Already implemented)
**Priority:** Low
**Complexity:** Simple
**Files:** `src/components/release-modal.tsx`

### Problem
Action buttons in release info modal don't show pointer cursor on hover.

### Current State
- Lines 155-160: Close button missing `cursor-pointer`
- Lines 162-171: Remove button missing `cursor-pointer` (has `disabled:cursor-not-allowed`)

### Solution
Add `cursor-pointer` class to both buttons.

### Implementation Steps

1. **Update Close button at line 157:**
   ```tsx
   className="px-4 py-2 text-sm font-medium text-(--foreground) bg-(--card) border border-(--border) rounded-md hover:bg-(--item) focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
   ```

2. **Update Remove button at line 166:**
   ```tsx
   className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2"
   ```

3. **Verify disabled state still shows not-allowed cursor**

### Testing
- Open release modal
- Hover over Close button → verify pointer cursor
- Hover over Remove button (if admin) → verify pointer cursor
- Verify disabled Remove button shows not-allowed cursor

**Playwright MCP Verification:**
- Navigate to `/browse`
- Click on a release tile info button
- Take screenshot of modal
- Hover over Close button and verify cursor changes
- Hover over Remove button (if admin) and verify cursor changes
- Use browser snapshot to inspect button elements

---

## Task 4: Investigate - Self-Hosting with Docker ✅

**Status:** ✅ COMPLETED (Better Auth integration)
**Priority:** High
**Complexity:** Complex
**Files:** Created `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/auth-helpers.ts`, `src/app/api/auth/[...all]/route.ts`, modified `src/app/settings/page.tsx`, `src/app/api/auth/me/route.ts`, `src/hooks/use-auth.ts`

**Completed Components:**
- ✅ Better Auth with SQLite database integration
- ✅ Email/password authentication (admin@krater.local)
- ✅ Session management with cookies
- ✅ Inline login form in settings page (no separate page needed)
- ✅ Auth checks on all protected API routes (POST, PUT, DELETE operations)
- ✅ Client-side auth state management with useAuth hook
- ✅ Automatic page refresh after login/logout
- ✅ Database initialization scripts (init-db.ts, create-admin.ts)

**Deferred for Later:**
- ⏸️ Docker/docker-compose setup (can be added when deploying)
- ⏸️ Rate limiting implementation
- ⏸️ Self-hosting documentation

### Problem
Project supports local dev (with API) and static export (no API). Need full-stack self-hosted deployment option.

### Current Architecture Gaps
- `src/middleware.ts:11` hardcoded `isDevelopment = false`
- API routes removed during static export (`.github/workflows/deploy.yml:54`)
- No production authentication
- No persistent session management

### Solution Components

#### 4.1 Docker Setup

**Create `Dockerfile`:**
```dockerfile
# Stage 1: Dependencies
FROM node:lts-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:lts-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN chown -R nextjs:nodejs ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
```

**Create `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  krater:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./public/covers:/app/public/covers
      - ./public/data:/app/public/data
      - ./krater.db:/app/krater.db
    environment:
      - NODE_ENV=production
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - DATABASE_URL=file:./krater.db
    restart: unless-stopped
```

**Create `.dockerignore`:**
```
node_modules
.next
build
.git
.env.local
*.log
```

#### 4.2 Authentication Implementation with Better Auth

**Install Better Auth:**
```bash
npm install better-auth
```

**Set up environment variables in `.env`:**
```
BETTER_AUTH_SECRET=your_random_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
ADMIN_PASSWORD=your_secure_admin_password
DATABASE_URL=file:./krater.db
```

**Create auth configuration `src/lib/auth.ts`:**
```typescript
import { betterAuth } from 'better-auth'
import Database from 'better-sqlite3'

export const auth = betterAuth({
  database: new Database('./krater.db'),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})
```

**Create API route handler `src/app/api/auth/[...all]/route.ts`:**
```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

**Create auth client `src/lib/auth-client.ts`:**
```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
})
```

**Generate database schema:**
```bash
npx @better-auth/cli generate
npx @better-auth/cli migrate
```

**Create login page `src/app/login/page.tsx`:**
```tsx
'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await authClient.signIn.email({
      email: 'admin@krater.local',
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/settings')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
```

**Update `src/middleware.ts`:**
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin endpoints
  if (pathname.startsWith('/api/') && requiresAuth(pathname)) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

function requiresAuth(pathname: string): boolean {
  const protectedPaths = ['/api/releases', '/api/artists', '/api/library-data', '/api/health']
  return protectedPaths.some(path => pathname.startsWith(path)) &&
         !pathname.match(/^\/api\/(releases|artists)$/) // Allow GET requests to list endpoints
}

export const config = {
  matcher: ['/api/:path*']
}
```

**Add session hook for client-side `src/hooks/use-auth.ts`:**
```typescript
'use client'

import { authClient } from '@/lib/auth-client'

export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession()

  return {
    isAuthenticated: !!session,
    isAdmin: !!session,
    isLoading: isPending,
    error,
    signOut: () => authClient.signOut(),
  }
}
```

**Create setup script to initialize admin user `scripts/create-admin.ts`:**
```typescript
import { auth } from '../src/lib/auth'

async function createAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set')
    process.exit(1)
  }

  try {
    // Create admin user
    const user = await auth.api.signUpEmail({
      body: {
        email: 'admin@krater.local',
        password: adminPassword,
        name: 'Admin',
      },
    })

    console.log('Admin user created successfully:', user.data?.user.email)
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
}

createAdmin()
```

**Add npm script in `package.json`:**
```json
{
  "scripts": {
    "setup:admin": "tsx scripts/create-admin.ts"
  }
}
```

#### 4.3 Configuration Updates

**Update `next.config.ts`:**
```typescript
const nextConfig = {
  output: process.env.NEXT_OUTPUT_MODE === 'export' ? 'export' : 'standalone',
  // ... rest of config
}
```

**Update `package.json`:**
```json
{
  "scripts": {
    "docker:build": "docker build -t krater .",
    "docker:run": "docker-compose up",
    "docker:stop": "docker-compose down"
  }
}
```

#### 4.4 Security Enhancements

**Add rate limiting to API routes:**
```bash
npm install express-rate-limit
```

**Create `src/lib/rate-limit.ts`:**
```typescript
const rateLimitMap = new Map()

export function rateLimit(limit = 10, window = 60000) {
  return (identifier: string) => {
    const now = Date.now()
    const userLimit = rateLimitMap.get(identifier)

    if (!userLimit) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + window })
      return true
    }

    if (now > userLimit.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + window })
      return true
    }

    if (userLimit.count >= limit) {
      return false
    }

    userLimit.count++
    return true
  }
}
```

#### 4.5 Documentation

**Create `docs/SELF_HOSTING.md`:**
```markdown
# Self-Hosting Krater

## Prerequisites
- Docker and Docker Compose installed
- Git

## Setup

1. Clone the repository
2. Create `.env` file with:
   ```
   BETTER_AUTH_SECRET=your_random_secret_key_here
   BETTER_AUTH_URL=http://your-domain.com
   ADMIN_PASSWORD=your_secure_admin_password
   DATABASE_URL=file:./krater.db
   ```
3. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
4. Build and run:
   ```bash
   docker-compose up -d
   ```
5. Initialize database and create admin user (first time only):
   ```bash
   # Access the container
   docker exec -it krater_krater_1 sh

   # Generate and run migrations
   npx @better-auth/cli generate
   npx @better-auth/cli migrate

   # Create admin user
   npm run setup:admin
   ```
6. Access at http://localhost:3000
7. Login at http://localhost:3000/login
   - Email: `admin@krater.local`
   - Password: (from your `.env` ADMIN_PASSWORD)

## Configuration
- `BETTER_AUTH_SECRET`: Secret key for auth encryption
- `BETTER_AUTH_URL`: Base URL of your deployment
- `ADMIN_PASSWORD`: Password for admin access
- `DATABASE_URL`: SQLite database path (use file:./krater.db for local file)
- `PORT`: Server port (default 3000)

## Data Persistence
- Cover images: `./public/covers` (mounted as volume)
- Library data: `./public/data` (mounted as volume)
- Auth database: `./krater.db` (mounted as volume)

## Backup
```bash
tar -czf krater-backup.tar.gz public/covers public/data krater.db
```

## Troubleshooting

**Cannot login:**
- Ensure admin user is created in the database
- Check `ADMIN_PASSWORD` matches in `.env` and database
- Verify `BETTER_AUTH_SECRET` is set and consistent

**Session expires immediately:**
- Check `BETTER_AUTH_URL` matches your actual URL
- Verify cookies are being set (check browser DevTools)
```

### Implementation Steps

1. Install Better Auth: `npm install better-auth better-sqlite3`
2. Create auth configuration (`src/lib/auth.ts`)
3. Create API route handler (`src/app/api/auth/[...all]/route.ts`)
4. Create auth client (`src/lib/auth-client.ts`)
5. Generate database schema: `npx @better-auth/cli generate`
6. Run migration: `npx @better-auth/cli migrate`
   - **⚠️ CHECKPOINT:** If migration fails or tables exist, ask for help before proceeding
7. Create login page (`src/app/login/page.tsx`)
8. Update middleware with Better Auth session checks
9. Create `useAuth` hook for client-side
10. Test basic auth flow locally (login/logout)
    - **⚠️ CHECKPOINT:** If auth doesn't work after 30 min, ask for help
11. Create Dockerfile
12. Create docker-compose.yml with database volume
13. Create .dockerignore
14. Update next.config.ts for standalone output
15. Add rate limiting to API routes
16. Create self-hosting documentation
17. Test Docker build and run locally
    - **⚠️ CHECKPOINT:** If Docker build fails multiple times, ask for help
18. Create admin user in database
19. Test authentication flow (login/logout)
20. Verify API routes are protected
21. Verify file uploads persist to volumes
22. Test Chrome extension with auth
    - **⚠️ CHECKPOINT:** If extension can't connect, ask for help with CORS/auth config

### Testing
- Build Docker image successfully
- Run container and access app
- Test authentication (login/logout)
- Test API endpoints with auth
- Upload file and verify persistence
- Restart container and verify data persists
- Test Chrome extension connection to self-hosted instance
- Test rate limiting

**Playwright MCP Verification:**
- Navigate to `/login`
- Fill in password field and submit form
- Verify redirect to dashboard/settings after login
- Test protected routes require authentication
- Navigate to settings and verify admin features visible
- Test logout functionality
- Verify redirect to login after logout
- Take screenshots of login flow

---

## Task 5: Investigate - Last.fm Integration

**Priority:** Medium
**Complexity:** Complex
**Files:** Create `src/lib/lastfm/`, `src/app/stats/`, `src/hooks/use-lastfm.ts`, `src/app/api/lastfm/`

### Problem
Add Last.fm integration to show listening stats and suggest albums based on scrobble history.

### Architecture Overview

#### 5.1 Last.fm API Setup

**Register app at https://www.last.fm/api/account/create**
- Get API key and shared secret
- Set callback URL for OAuth

**Add environment variables:**
```
LASTFM_API_KEY=your_api_key
LASTFM_API_SECRET=your_api_secret
```

#### 5.2 Data Matching Strategy

**Approach: Artist + Album Name Fuzzy Matching**

**Create `src/lib/lastfm/matching.ts`:**
```typescript
import Fuse from 'fuse.js'
import type { Release } from '@/lib/data'

interface LastFmAlbum {
  name: string
  artist: string
  playcount: number
  mbid?: string
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
}

export function matchReleaseToLastFm(
  release: Release,
  artists: Artist[],
  lastFmAlbums: LastFmAlbum[]
): LastFmAlbum | null {
  const releaseTitle = normalizeString(release.title)
  const releaseArtists = release.artistRymIds
    .map(id => artists.find(a => a.rymId === id))
    .filter(Boolean)
    .map(a => normalizeString(a.displayName))

  // First try exact match
  for (const lfAlbum of lastFmAlbums) {
    const lfTitle = normalizeString(lfAlbum.name)
    const lfArtist = normalizeString(lfAlbum.artist)

    if (releaseTitle === lfTitle && releaseArtists.some(a => a === lfArtist)) {
      return lfAlbum
    }
  }

  // Fall back to fuzzy match with Fuse.js
  const fuse = new Fuse(lastFmAlbums, {
    keys: ['name', 'artist'],
    threshold: 0.3,
  })

  const query = `${release.title} ${releaseArtists.join(' ')}`
  const results = fuse.search(query)

  return results.length > 0 ? results[0].item : null
}
```

#### 5.3 API Routes

**Create `src/app/api/lastfm/connect/route.ts`:**
```typescript
export async function GET(request: Request) {
  const authUrl = `http://www.last.fm/api/auth/?api_key=${process.env.LASTFM_API_KEY}&cb=${callbackUrl}`
  return NextResponse.redirect(authUrl)
}
```

**Create `src/app/api/lastfm/callback/route.ts`:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Exchange token for session key
  const sessionKey = await getSessionKey(token)

  // Store in encrypted cookie or database
  // Redirect to settings
}
```

**Create `src/app/api/lastfm/stats/route.ts`:**
```typescript
export async function GET(request: Request) {
  const sessionKey = await getLastFmSession(request)

  // Fetch user's top albums from Last.fm
  const topAlbums = await fetchUserTopAlbums(sessionKey)

  // Fetch library data
  const { releases, artists } = await getLibraryData()

  // Match Last.fm albums to library releases
  const matchedStats = releases.map(release => {
    const match = matchReleaseToLastFm(release, artists, topAlbums)
    return {
      release,
      playcount: match?.playcount || 0,
      lastScrobbled: match?.lastScrobbled,
    }
  })

  // Sort by playcount
  const mostPlayed = matchedStats
    .filter(s => s.playcount > 0)
    .sort((a, b) => b.playcount - a.playcount)
    .slice(0, 20)

  const leastPlayed = matchedStats
    .filter(s => s.playcount === 0)

  return NextResponse.json({ mostPlayed, leastPlayed })
}
```

**Create `src/app/api/lastfm/suggestions/route.ts`:**
```typescript
export async function GET(request: Request) {
  const sessionKey = await getLastFmSession(request)
  const { releases } = await getLibraryData()

  // Fetch user's top albums from Last.fm
  const topAlbums = await fetchUserTopAlbums(sessionKey, { limit: 100 })

  // Filter out albums already in library
  const suggestions = topAlbums
    .filter(lfAlbum => {
      return !releases.some(release => {
        const match = matchReleaseToLastFm(release, artists, [lfAlbum])
        return match !== null
      })
    })
    .slice(0, 20)

  return NextResponse.json({ suggestions })
}
```

#### 5.4 Frontend Components

**Create `src/app/stats/page.tsx`:**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useLastFmStats } from '@/hooks/use-lastfm'
import { MusicTile } from '@/components'
import { PageHeader } from '@/components'

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState<'1month' | '3month' | 'overall'>('1month')
  const { mostPlayed, leastPlayed, isLoading, error } = useLastFmStats(timeRange)

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Listening Stats" />

      <div className="mb-4">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="1month">Last Month</option>
          <option value="3month">Last 3 Months</option>
          <option value="overall">All Time</option>
        </select>
      </div>

      <section>
        <h2>Most Played from Library</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mostPlayed.map(({ release, playcount }) => (
            <div key={release.rymId}>
              <MusicTile {...release} />
              <p className="text-sm text-gray-600">{playcount} plays</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2>Not Yet Played</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {leastPlayed.map(({ release }) => (
            <MusicTile key={release.rymId} {...release} />
          ))}
        </div>
      </section>
    </div>
  )
}
```

**Create `src/hooks/use-lastfm.ts`:**
```typescript
import useSWR from 'swr'

export function useLastFmStats(timeRange: string) {
  const { data, error, isLoading } = useSWR(
    `/api/lastfm/stats?timeRange=${timeRange}`,
    fetcher
  )

  return {
    mostPlayed: data?.mostPlayed || [],
    leastPlayed: data?.leastPlayed || [],
    isLoading,
    error
  }
}

export function useLastFmSuggestions() {
  const { data, error, isLoading } = useSWR('/api/lastfm/suggestions', fetcher)

  return {
    suggestions: data?.suggestions || [],
    isLoading,
    error
  }
}

export function useLastFmConnection() {
  const { data, error, mutate } = useSWR('/api/lastfm/user', fetcher)

  const connect = () => {
    window.location.href = '/api/lastfm/connect'
  }

  const disconnect = async () => {
    await fetch('/api/lastfm/disconnect', { method: 'POST' })
    mutate()
  }

  return {
    user: data?.user,
    isConnected: !!data?.user,
    connect,
    disconnect,
    error
  }
}
```

#### 5.5 Settings Integration

**Update `src/app/settings/page.tsx`:**
```tsx
import { useLastFmConnection } from '@/hooks/use-lastfm'

// Inside component:
const { user, isConnected, connect, disconnect } = useLastFmConnection()

// In render:
<section>
  <h2>Last.fm Integration</h2>
  {isConnected ? (
    <div>
      <p>Connected as: {user.username}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  ) : (
    <button onClick={connect}>Connect Last.fm</button>
  )}
</section>
```

#### 5.6 Main Menu Integration

**Update `src/app/page.tsx`:**
Add new menu option:
```tsx
<MenuItem href="/stats" startIcon={BarChart}>
  Listening Stats
</MenuItem>
```

### Implementation Steps

1. Register Last.fm API application
   - **⚠️ CHECKPOINT:** If API registration unclear, ask for credentials/guidance
2. Install dependencies: `npm install fuse.js`
3. Create Last.fm API client (`src/lib/lastfm/api.ts`)
4. Create matching utility (`src/lib/lastfm/matching.ts`)
5. Implement OAuth flow (connect/callback routes)
   - **⚠️ CHECKPOINT:** If OAuth flow stuck after 45 min, ask for help
6. Test OAuth connection manually before proceeding
7. Implement stats API route
8. Implement suggestions API route
9. Create stats page
10. Create Last.fm hooks
11. Update settings page with connection UI
12. Update main menu with stats link
13. Test connection flow
14. Test matching algorithm accuracy
    - **⚠️ CHECKPOINT:** If matching accuracy <70%, ask for algorithm review
15. Test stats display

### Testing
- Connect Last.fm account
- Verify OAuth flow works
- Test matching algorithm with various album names
- Check stats page displays correctly
- Verify time range filter works
- Test suggestions show albums not in library
- Test disconnect functionality
- Handle API rate limits gracefully

**Playwright MCP Verification:**
- Navigate to `/settings`
- Verify Last.fm connection section exists
- Click "Connect Last.fm" button
- Verify OAuth redirect (or mock for testing)
- Navigate to `/stats` after connection
- Take screenshot of stats page
- Test time range selector dropdown
- Verify most played and least played sections render
- Take screenshots of different time ranges

---

## Task 6: Chore - Remove `/next` Claude Command ✅

**Status:** ✅ COMPLETED (File already removed)
**Priority:** Low
**Complexity:** Simple
**Files:** Delete `.claude/commands/next.md`, potentially update `CLAUDE.md`

### Problem
`/next` command no longer needed.

### Implementation Steps

1. Delete `.claude/commands/next.md`
2. Check if `CLAUDE.md` references the command (search for "next" or "/next")
3. Remove any references if found
4. Commit with message: "chore: remove /next claude command"

### Testing
- Verify file deleted
- Try using `/next` command → should not exist

---

## Task 7: Test - Make CI Coverage Non-Blocking ✅

**Status:** ✅ COMPLETED (Commit: 5281427)
**Priority:** Low
**Complexity:** Simple
**Files:** `vitest.config.ts`, potentially `.github/workflows/*.yml`

### Problem
CI fails when coverage thresholds not met. Coverage should be informational, not blocking.

### Current State
- `vitest.config.ts:29-34` defines thresholds
- Thresholds cause test command to exit with non-zero code when not met

### Solution
Remove coverage thresholds from config.

### Implementation Steps

1. **Update `vitest.config.ts`:**
   ```typescript
   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'happy-dom',
       globals: true,
       setupFiles: ['./vitest.setup.ts'],
       exclude: ['**/e2e/**', '**/node_modules/**'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: [
           'node_modules/',
           'build/',
           '.next/',
           '*.config.ts',
           '*.config.js',
           '*.config.mjs',
           '**/*.d.ts',
           'src/app/manifest.ts',
           'chrome-extension/**',
           'src/__tests__/**',
           '.prettierrc.js',
           'eslint.config.js',
         ],
         // Remove thresholds object entirely
       },
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

2. **If CI workflow exists (`.github/workflows/test.yml`):**
   - No changes needed if using `npm test`
   - Coverage report still generated but doesn't fail build

3. **Test locally:**
   ```bash
   # Temporarily add code that lowers coverage
   # Run tests
   npm run test:coverage
   # Verify tests pass even with lower coverage
   # Verify coverage report still generated
   # Revert test changes
   ```

### Testing
- Run `npm run test:coverage`
- Verify tests pass regardless of coverage percentage
- Verify coverage report still generated in terminal and HTML
- Check CI pipeline passes

---

## Implementation Priority Order

Recommended sequence:

1. **Task 6** - Remove command (30 seconds)
2. **Task 7** - Coverage config (2 minutes)
3. **Task 3** - Cursor fix (5 minutes)
4. **Task 1** - Image loading (30 minutes)
5. **Task 2** - Layout optimization (1-2 hours)
6. **Task 4** - Docker/self-hosting (4-6 hours)
7. **Task 5** - Last.fm integration (8-12 hours)

### Parallelization Opportunities

**Phase 1: Quick wins (can run in parallel)**
- Task 6 + Task 7 + Task 3 (all independent, simple changes)
- Estimated time: 5 minutes (vs 37+ minutes sequential)

**Phase 2: UI improvements (do sequentially)**
- Task 1 then Task 2 (both affect layout/rendering, best done one at a time)
- Estimated time: 2-3 hours

**Phase 3: Major features (do sequentially)**
- Task 4 then Task 5 (both add infrastructure, Task 5 may need auth from Task 4)
- Estimated time: 12-18 hours

**Aggressive parallelization (advanced):**
If you're confident in your ability to manage conflicts:
- Run Phase 1 tasks in parallel (Tasks 3, 6, 7)
- While Phase 2 is running, begin research/planning for Phase 3
- Task 4 and Task 5 could potentially run in parallel if Task 5 doesn't need auth initially

---

## General Guidelines

### Using Subagents for Parallel Work

**Strategy:** Use subagents to speed up development when tasks are clearly separated and don't have dependencies or conflicts.

**When to use subagents in parallel:**
- ✅ Implementing completely separate features (e.g., Task 1 + Task 5)
- ✅ Working on different files with no overlap (e.g., different API routes)
- ✅ Simple, isolated tasks that can be done independently (e.g., Tasks 6 + 7)
- ✅ UI components in different parts of the application
- ✅ Tests for different modules simultaneously

**When NOT to use subagents in parallel:**
- ❌ Tasks that modify the same files (will cause merge conflicts)
- ❌ Tasks with dependencies (one must complete before the other starts)
- ❌ Tasks that share configuration or setup steps
- ❌ Tasks that modify core infrastructure (middleware, auth, database schema)
- ❌ When unclear about file overlaps or dependencies

**Example parallelization opportunities from this plan:**

**Good parallel combinations:**
```
# These are completely independent
Task 6 (Remove /next command) + Task 7 (Coverage config)

# These work on different parts of the codebase
Task 1 (Image loading - constants + browse page) + Task 3 (Cursor fix - modal component)

# Simple isolated changes
Task 3 (Modal cursor) + Task 6 (Remove command) + Task 7 (Coverage config)
```

**Bad parallel combinations:**
```
# Both modify middleware and auth system
Task 4 (Docker/Auth) + Task 5 (Last.fm) ❌

# Task 2 affects layout throughout app, Task 1 affects browse page
Task 1 (Image loading) + Task 2 (Layout optimization) ❌

# Both modify core infrastructure
Task 2 (Layout context) + Task 4 (Auth system) ❌
```

**How to use subagents:**
1. Identify truly independent tasks from the priority order
2. Launch subagents with clear, specific instructions for each task
3. Specify which files each agent should work on
4. Tell agents to report back when complete
5. Review all changes for conflicts before integrating
6. If conflicts arise, resolve them manually or ask for help

**Subagent communication:**
- Each subagent works autonomously and reports back once
- Cannot communicate with each other during execution
- Main agent is responsible for coordination and conflict resolution
- If subagent gets stuck, it should report the issue rather than wait indefinitely

### When to Ask for Help

**IMPORTANT:** If you encounter any of the following situations, STOP and ask the human supervisor for help or instructions:

1. **Stuck in a loop** - Attempting the same solution repeatedly without progress
2. **Taking too long** - Spending more than 30 minutes on a single step without meaningful progress
3. **Implementation uncertainty** - Multiple valid approaches and unclear which to choose
4. **Breaking changes** - Changes that might break existing functionality
5. **Missing information** - Required credentials, API keys, or configuration details not available
6. **Unexpected errors** - Errors that don't have clear solutions or documentation
7. **Architecture questions** - Decisions that affect the overall system design
8. **Scope creep** - Task expanding beyond the original plan

**How to ask for help:**
- Clearly describe what you're trying to accomplish
- Explain what you've tried so far
- Show relevant error messages or logs
- Ask specific questions about the path forward
- Suggest possible solutions if you have ideas

**Example:**
> "I've been trying to implement Better Auth database initialization for 30 minutes. I've tried running the migration command 3 times but keep getting 'table already exists' errors. I've looked at the Better Auth docs but they don't cover this scenario. Should I:
> 1. Drop the existing tables and re-run migration?
> 2. Use a different database adapter?
> 3. Skip migration and manually create tables?
>
> What would you recommend?"

### Code Quality
- Follow existing patterns in codebase
- Use TypeScript strictly (no `any`)
- Prefer functional components with hooks
- Memoize expensive computations
- Add JSDoc comments to utilities

### Testing Requirements
- Unit tests for new utilities
- Integration tests for API routes
- Component tests for UI changes
- Maintain >80% coverage on new code

### Playwright MCP for User-Facing Changes
**Important:** All user-facing changes MUST be verified using Playwright MCP before completion.

The Playwright MCP provides browser automation tools that allow you to:
- Navigate to pages and take screenshots
- Interact with UI elements (click, type, hover)
- Verify visual changes and behavior
- Test responsive layouts
- Capture page snapshots for accessibility testing

**When to use Playwright MCP:**
- After implementing UI changes
- After fixing visual bugs
- Before marking UI-related tasks as complete
- To verify responsive behavior
- To test user flows (login, navigation, forms)

**Example Playwright MCP workflow:**
1. Start dev server: `npm run dev`
2. Use `mcp__playwright__browser_navigate` to open page
3. Use `mcp__playwright__browser_snapshot` to inspect elements
4. Use `mcp__playwright__browser_click` to interact with UI
5. Use `mcp__playwright__browser_take_screenshot` to capture state
6. Verify expected behavior matches actual behavior

**Common Playwright MCP tools:**
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Get accessibility tree snapshot
- `browser_take_screenshot` - Capture visual state
- `browser_click` - Click elements
- `browser_type` - Fill form fields
- `browser_hover` - Hover over elements
- `browser_resize` - Test responsive layouts

### Performance
- Profile before/after with React DevTools
- Use React.memo for expensive components
- Lazy load heavy dependencies
- Optimize images with Next.js Image

### Documentation
- Update CLAUDE.md if architecture changes
- Update README.md for user-facing features
- Add inline comments for complex logic
- Update ROADMAP.md when tasks completed

---

**Document Version:** 3.0
**Last Updated:** 2025-10-11
**Covers:** ROADMAP.md tasks
**Key Updates in v3.0:**
- Replaced NextAuth with Better Auth for self-hosting (Task 4)
- Added Playwright MCP verification requirements for all user-facing changes
- Added "When to Ask for Help" guidelines and checkpoints throughout implementation steps
- Added comprehensive subagent parallelization strategy with examples of good/bad combinations
- Included parallelization phases in implementation priority order
