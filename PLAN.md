# Plan

## Task Status Legend
- `[ ]` TODO
- `[~]` IN PROGRESS
- `[x]` COMPLETED
- `[!]` BLOCKED
- `[-]` SKIPPED

---

## Static rewrite

Krater is a personal site, so the server, accounts, database, and Docker image are gone. The site is a static Vite + React app, and the browser extension adds releases to your clone through a local helper, so you review and commit every change.

### Phase 1: Data contract
- `[x]` Replace `[ArtistNNN]` artist IDs with RYM URL slugs (`scripts/migrate-artist-slugs.js`)
- `[x]` Fix the extension's artist extraction (RYM dropped the `title` attribute)
- `[x]` Add `scripts/validate-library.js` in place of the health API, with tests
- `[x]` Drop the legacy `releases.json` and `artists.json`

### Phase 2: Site
- `[x]` Replace Next.js with Vite, `wouter`, and the Tailwind Vite plugin
- `[x]` Port pages and components (`next/link` to `AppLink`, `next/image` to `<img>`)
- `[x]` Remove auth, the SQLite database, all `/api` routes, the JSON editor, and the health check
- `[-]` Last.fm and listening stats: dropped for now, see `ROADMAP.md`
- `[x]` Rewrite unit and E2E tests for the new structure
- `[x]` Replace the deploy workflow, remove the Docker workflow, update the test workflow

### Phase 3: Extension
- `[x]` Move network work into the background script
- `[-]` Commit through the GitHub API with a token: replaced by a local helper so the user commits
- `[x]` Helper mounted on the Vite dev server at `/__krater` (loopback only, origin and header checks, validates before writing, reloads open tabs)
- `[x]` Convert covers to WebP in the browser
- `[x]` Unit tests for the library edits, the helper client, the helper server, and the background script
- `[x]` Try add, remove, live reload, and "dev server offline" end to end in Chromium against a real dev server on a copy of the data
- `[ ]` Try add and remove with the real RYM pages in Chrome and Firefox
- `[ ]` Replace the placeholder Firefox add-on ID (`krater@example.com`) before publishing a signed build

### Phase 4: Wrap-up
- `[ ]` Merge `static-rewrite` into `main` and confirm the first Pages deploy
- `[ ]` Delete the leftover local files: `krater.db`, `.env.local` (`ADMIN_SECRET`, Better Auth, and Last.fm keys)
- `[ ]` Revoke the Last.fm API key if it is no longer used
