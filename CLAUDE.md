# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Guidelines

**Planning and Estimates:**
- When creating plans or strategies, NEVER include real-time estimates (hours, days, weeks, etc.)
- Focus on task descriptions, priorities, and dependencies instead
- Use relative complexity indicators if needed (e.g., "simple", "complex", "requires careful consideration")

**Master Plan:**
- `MASTER_PLAN.md` is the single source of truth for all development activities
- Always consult the master plan before starting work
- Update task statuses as work progresses: `[ ]` TODO, `[~]` IN PROGRESS, `[x]` COMPLETED, `[!]` BLOCKED, `[-]` SKIPPED
- Add new tasks, features, or fixes to the appropriate phase in the master plan
- The master plan is a living document - keep it current and accurate
- Follow the defined order of operations (implement tests → verify tests → make improvements → verify again)
- Use `/next` command to navigate to the next incomplete task in the master plan

## Project Overview

Krater is a Next.js-based static website generator for showcasing music collections. It mimics browsing a physical vinyl collection with a visual, album-focused interface. The project is highly opinionated: albums only (no tracks/playlists), minimalist data storage, and designed for static deployment.

**Key Philosophy:**
- Vinyl analogy for browsing experience
- Albums only, no individual tracks or playlists
- Minimal data: release name, artist, cover art, and Spotify link
- Static site generation for fast, backend-free hosting

## Development Commands

```bash
# Local development server (runs on http://localhost:3000/krater)
npm run dev

# Build for production (outputs to build/)
npm run build

# Build for static export (for GitHub Pages, Netlify, etc.)
npm run export

# Linting
npm run lint
```

**Local Development Setup:**
1. Create `.env.local` with: `NEXT_PUBLIC_IS_LOCALHOST=true`
2. Run `npm run dev`
3. Load the Chrome extension from `chrome-extension/` directory (Developer mode)

## Architecture

### Data Model

The application uses a dual-storage architecture:

**Static Mode (Production):** Data served from JSON files:
- `public/data/libraryData.json` - Combined releases and artists data
- `public/data/releases.json` - Legacy releases data
- `public/data/artists.json` - Legacy artists data
- `public/covers/` - Cover art images

**Development Mode:** REST API endpoints manage data:
- `/api/library-data` - Read/write libraryData.json
- `/api/releases` - CRUD operations for releases (GET, POST, PUT, DELETE)
- `/api/artists` - CRUD operations for artists (GET, POST, PUT, DELETE)
- `/api/covers` - Cover image upload/management
- `/api/health` - Health check for unused covers, artists, missing files
- `/api/check` - Verify if release exists
- `/api/auth/*` - Authentication endpoints for admin features

Core types (`src/lib/data/index.ts`):
```typescript
type Release = {
  artistRymIds: string[]
  title: string
  rymId: string
  rymUrl?: string
  cover: string
  media: { spotify?: string }
}

type Artist = {
  displayName: string
  rymId: string
  rymUrl?: string
}

type LibraryData = {
  releases: Release[]
  artists: Artist[]
}
```

Server utilities (`src/lib/server/index.ts`) handle file I/O with proper error handling and Unicode normalization for cover filenames.

### Chrome Extension Integration

The Chrome extension (`chrome-extension/`) allows adding releases from RateYourMusic.com:
- Extracts release data (artist, title, cover) from RYM pages
- Sends data to local dev server at `http://localhost:3000`
- Downloads and uploads cover images automatically
- Can also remove releases if already added

**Requirements:** Local dev server must be running for the extension to work.

### Frontend Architecture

Built with Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4.

**Key Pages:**
- `/` - Main landing page (welcome screen)
- `/browse` - Browse all releases with filtering
- `/artists` - Artist directory
- `/random` - Random release discovery
- `/card` - Individual release card view
- `/settings` - Application settings (theme, library data management)

**Custom Hooks:**
- `useLibraryData()` - Fetch and manage library data with sorting options (asc/desc/random)
- `useAuth()` - Authentication state management
- `useHealthCheck()` - Check data integrity issues
- `useTheme()` - Theme management wrapper around next-themes

**UI Components** (`src/components/`):
- `music-tile.tsx` - Release tile with cover art
- `spotify-play-button.tsx` - Spotify integration
- `search-input.tsx`, `clearable-tag.tsx` - Filtering UI
- `action-button.tsx`, `menu-item.tsx` - Common UI elements

### Configuration

**Next.js Config (`next.config.ts`):**
- Custom `distDir: 'build'` (not default `.next`)
- Supports both standard build and static export via `NEXT_OUTPUT_MODE=export`
- CORS headers configured for API routes
- Images set to `unoptimized: true` for static hosting compatibility
- `basePath` configurable via env (currently empty string)

**Middleware (`src/middleware.ts`):**
- Admin session verification for `/api/health` endpoint
- Cookie-based auth check (`admin-session` cookie)
- Currently `isDevelopment` is hardcoded to `false`

### Deployment

The project supports static deployment to GitHub Pages, Netlify, or Vercel:

1. Run `npm run export` to generate static files in `build/`
2. Deploy the `build/` directory contents
3. See `.github/workflows/deploy.yml` for GitHub Pages example

**Important:** Cover images must exist in `public/covers/` and match filenames in the data JSON exactly (case-sensitive, Unicode-normalized).

## Data Management

**Adding Releases Manually:**
Edit `public/data/libraryData.json` following the existing structure. Ensure:
- Cover image exists at `public/covers/{cover-filename}`
- Artists referenced by `artistRymIds` exist in the artists array
- `rymId` is unique

**Cover Art Management:**
- Place images in `public/covers/`
- Filenames are Unicode-normalized (NFC) and should match exactly
- Extension handles downloading from RYM automatically

**Data Integrity:**
Use the `/api/health` endpoint to check for:
- Unused cover files
- Unused artists (not referenced by any release)
- Missing cover files (referenced but not found)
- Missing artists (referenced but not defined)

## Current Development Status

See `ROADMAP.md` for planned features. The project is in active development (0.1 beta):
- Library data editing in settings page (in progress)
- Manage page issues when release has empty artists
- Preparing for 0.1 release on GitHub

## Testing Notes

- No test suite currently configured
- Manual testing via Chrome extension + local dev server
- Health check endpoint useful for data validation

## Important Constraints

- **RateYourMusic-centric:** Data model assumes RYM IDs and URLs
- **Spotify-only:** Media player links currently hardcoded for Spotify
- **No backend in production:** Static export means no API routes in deployed version
- **Case-sensitive filenames:** Cover art filename matching is case-sensitive and Unicode-normalized
