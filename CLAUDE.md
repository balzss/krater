# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Guidelines

**Planning and Estimates:**
- When creating plans or strategies, NEVER include real-time estimates (hours, days, weeks, etc.)
- Focus on task descriptions, priorities, and dependencies instead
- Use relative complexity indicators if needed (e.g., "simple", "complex", "requires careful consideration")

**Plan:**
- `PLAN.md` is the single source of truth for development activities
- Always consult the plan before starting work
- Update task statuses as work progresses: `[ ]` TODO, `[~]` IN PROGRESS, `[x]` COMPLETED, `[!]` BLOCKED, `[-]` SKIPPED
- Add new tasks, features, or fixes to the plan; keep it current and accurate
- Follow the defined order of operations (implement tests → verify tests → make improvements → verify again)

## Project Overview

Krater is a static website for showcasing a music collection. It mimics browsing a physical vinyl collection with a visual, album-focused interface. The project is highly opinionated and **personal**: albums only (no tracks/playlists), minimal data, one user, public hosting on GitHub Pages.

**Key Philosophy:**
- Vinyl analogy for browsing experience
- Albums only, no individual tracks or playlists
- Minimal data: release name, artist, cover art, and listening links
- No backend, no accounts. The repository is the database.

## Development Commands

```bash
npm run dev          # Vite dev server on http://127.0.0.1:5173 (port is pinned), also serves the extension helper
npm run build        # Type check + production build into dist/ (also writes dist/404.html)
npm run preview      # Serve the production build
npm run typecheck    # tsc --noEmit
npm run validate     # Validate public/data/libraryData.json and public/covers
npm run lint         # Prettier check
npm test             # Vitest (watch mode)
npm run test:e2e     # Playwright (builds and previews the site itself)
```

## Architecture

### Stack

Vite + React 19 + TypeScript + Tailwind CSS 4, routed with `wouter`. Output is a plain static site. No server code ships or runs.

### Data Model

Everything lives in `public/data/libraryData.json` and `public/covers/`.

```typescript
type Release = {
  artistRymIds: string[] // slugs of the artists, see below
  title: string
  rymId: string // "[Album123]" from the RYM release page
  rymUrl?: string
  cover: string // file name in public/covers/
  media: { spotify?: string; appleMusic?: string; ... }
}

type Artist = {
  displayName: string
  rymId: string // the slug of rymUrl, e.g. "the-alchemist-2"
  rymUrl?: string
}

type LibraryData = { releases: Release[]; artists: Artist[] }
```

**Artist keys are RYM URL slugs.** RYM no longer exposes numeric artist IDs on release pages. The field is still called `rymId` to keep the type stable. `scripts/validate-library.js` enforces that it matches the slug in `rymUrl`.

### Browser Extension and Dev-Server Helper

`extension/` is a Manifest V3 extension for Chrome and Firefox. It never touches git or GitHub.
- `content.js` reads a RYM release page and renders the Add/Remove/Refresh buttons.
- `background.js` downloads the cover, converts it to WebP, and calls the helper. All network work is here so page CORS rules don't apply.
- `lib/helper.js` is the client. It only accepts a loopback URL (default `http://127.0.0.1:5173`) and posts to `/__krater/*`.
- `lib/library.js` holds the pure edit logic (add, remove, serialize), shared with the helper.
- `scripts/library-helper.js` is the server side: `createHelperHandler` (the routes `/status`, `/save`, `/remove`) and `kraterHelperPlugin`, a Vite plugin that mounts it at `/__krater` on the dev server (`apply: 'serve'`, so it never exists in a build). `vite.config.ts` pins the dev server to `127.0.0.1:5173` with `strictPort` so the extension's address never moves.
- The helper edits `public/data/libraryData.json` and `public/covers/` in the clone, validates the library before writing, and tells Vite to full-reload open tabs after a write. The user reviews and commits the result.
- Settings (dev server URL, enabled) are in `chrome.storage.local`.
- Tests: `src/__tests__/unit/extension/` and `src/__tests__/unit/scripts/library-helper.test.ts` (including one that runs the plugin inside a real Vite dev server).

### Frontend

**Pages** (`src/pages/`): home, `/browse` (filter by `?artist=slug`), `/artists`, `/random`, `/card`, `/settings` (theme, layout, preferred media player).

**Hooks** (`src/hooks/`): `useLibraryData` (fetches the JSON once and shares it), `useTheme`, `useLayout`, `useMediaPreference`, `useSearch`, `usePageTitle`.

**Components** (`src/components/`): `MusicTile`, `ReleaseModal`, `SearchInput`, `ActionButton`, `MenuItem`, `ClearableTag`, `PageHeader`, `SpotifyPlayButton`, and `AppLink` (client-side navigation for app routes, plain anchors for external links).

### Configuration

- `vite.config.ts` holds the build and Vitest config. `base` comes from `VITE_BASE` (default `/`).
- GitHub Pages has no SPA fallback, so the build copies `index.html` to `404.html`.
- `index.html` sets the theme class before first paint (storage key `color-theme`).

### Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: validate data, run tests, build, publish `dist/` to GitHub Pages. Pushing the changes the helper made triggers it. Pull requests run `.github/workflows/test.yml`.

## Data Management

- Add releases with the extension (run `npm run dev` first), or edit `public/data/libraryData.json` by hand and run `npm run validate`.
- Cover filenames are case-sensitive and Unicode-normalized (NFC) and must match the `cover` field exactly.
- `scripts/migrate-artist-slugs.js` was the one-off migration from `[ArtistNNN]` IDs to slugs.

## Version Management

The project uses automated version bumping via git hooks. When you commit:

1. **Lint check runs** to ensure code quality (can be skipped with `--no-lint`)
2. **Changes are analyzed** based on commit message and modified files
3. **Version bump is suggested** following semantic versioning (major/minor/patch)
4. **User confirms** the bump type (or it auto-applies in non-interactive mode)
5. **package.json is updated** and staged automatically

**Semantic Versioning:**
- **MAJOR (x.0.0):** Breaking changes, incompatible API changes
- **MINOR (0.x.0):** New features, backwards-compatible functionality
- **PATCH (0.0.x):** Bug fixes, backwards-compatible fixes

**Conventional Commit Format:**
```bash
feat: add new feature         # → minor bump
fix: resolve bug              # → patch bump
feat!: breaking change        # → major bump
docs: update documentation    # → patch bump or skip
```

**Manual version bumping:**
```bash
npm run version:bump          # Interactive mode with lint check
npm run version:bump:no-lint  # Skip lint check
npm run version:major         # Force major bump (1.0.0 → 2.0.0)
npm run version:minor         # Force minor bump (1.0.0 → 1.1.0)
npm run version:patch         # Force patch bump (1.0.0 → 1.0.1)
```

**Skipping version bump:**
- Select "skip" when prompted during commit
- Use `git commit --no-verify` to bypass all hooks
- Changes to docs/tests only are auto-detected and suggest "skip"

**Configuration:**
The version bump behavior is configured in `package.json`:
```json
{
  "versionBump": {
    "enabled": true,
    "interactive": true,
    "lintBeforeBump": true,
    "skipPaths": ["README.md", "docs/", "**/*.test.ts", "__tests__/"]
  }
}
```

## Testing

- Vitest for unit and component tests, Playwright for E2E, MSW for the data request, React Testing Library for components.
- E2E tests run against the production build and the real library data.

```
src/__tests__/
  ├── unit/          # hooks, scripts, extension lib
  ├── components/    # component tests
  ├── mocks/         # MSW handler and test data
  └── utils/         # test utilities
e2e/                 # Playwright tests
```

## Important Constraints

- **RateYourMusic-centric:** the data model assumes RYM URLs and the extension scrapes RYM pages, so it breaks when RYM changes its markup.
- **No backend:** anything that needs a secret must run locally, never in the site.
- **Case-sensitive filenames:** cover art matching is exact.
- **Dev-server helper:** anything that can reach the dev server could edit the library, so the helper requires `X-Krater: 1`, rejects any non-extension `Origin`, and checks `Host`. Keep those checks, and keep the dev server on loopback, when changing it.
