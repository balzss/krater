# Scripts

This directory contains utility scripts for the project.

## library-helper.js

The part of the dev server the browser extension talks to. It edits `public/data/libraryData.json` and `public/covers/` in this clone and never runs git. `vite.config.ts` mounts it at `/__krater` through `kraterHelperPlugin`, so it exists only while `npm run dev` is running.

Endpoints (all `POST`, JSON): `/status`, `/save`, `/remove`. Requests need the `X-Krater: 1` header, must come from a `chrome-extension://` or `moz-extension://` origin (or have none), and must use a `127.0.0.1` or `localhost` host. Edits are validated with `validate-library.js` before anything is written, covers must be WebP, and open browser tabs are told to reload after a successful write.

## validate-library.js

Checks `public/data/libraryData.json` and `public/covers/` and exits with 1 on errors.

- Errors: duplicate IDs, releases that reference unknown artists, missing cover files, invalid links, artist keys that don't match the slug in their `rymUrl`
- Warnings: artists and covers that no release uses

```bash
npm run validate
```

The deploy workflow runs it before building, so a broken library is never published.

## migrate-artist-slugs.js

One-off migration from `[ArtistNNN]` artist IDs to RYM URL slugs. Dry run by default, `--write` applies it and requires a clean git state for the file. It does nothing when the library already uses slugs.

## bump-version.js

Automated version bumping script that runs as a git hook.

**Features:**
- Runs linting on staged files before version bump
- Analyzes commit messages (conventional commits)
- Analyzes changed files to suggest bump type
- Interactive prompts with smart suggestions (disabled in CI/agentic workflows)
- Automatic detection of non-interactive environments
- Supports forced bump types via CLI
- Configurable via package.json

**Usage:**

```bash
# Interactive mode with lint check
npm run version:bump

# Skip lint check
npm run version:bump:no-lint

# Force specific bump type
npm run version:major    # 1.0.0 → 2.0.0
npm run version:minor    # 1.0.0 → 1.1.0
npm run version:patch    # 1.0.0 → 1.0.1

# Direct invocation
node scripts/bump-version.js              # Interactive
node scripts/bump-version.js --no-lint   # Skip lint
node scripts/bump-version.js major        # Force major
node scripts/bump-version.js "feat: msg"  # Analyze commit message
```

**Git Hook Integration:**

The script runs automatically on commit via `.husky/pre-commit` hook (before tests).

To bypass the hook:
```bash
git commit --no-verify
```

**Agentic Workflow Support:**

The script automatically detects non-interactive environments (CI, Claude Code, etc.) and:
- Disables interactive prompts
- Uses smart auto-suggestions based on file changes
- Skips linting for faster execution (configurable)

Environment detection checks for:
- `CI=true`
- `CLAUDE_CODE=true`
- `NON_INTERACTIVE=true`
- Non-TTY stdin

**Configuration:**

Edit `package.json`:
```json
{
  "versionBump": {
    "enabled": true,
    "interactive": true,
    "lintBeforeBump": true,
    "autoSkipInCI": true,
    "skipPaths": ["README.md", "docs/", "**/*.test.ts", "__tests__/"]
  }
}
```

**Options:**
- `enabled`: Enable/disable version bumping (default: `true`)
- `interactive`: Enable interactive prompts (auto-disabled in CI/agentic workflows)
- `lintBeforeBump`: Run lint check before bumping (default: `true`)
- `autoSkipInCI`: Automatically use non-interactive mode in CI (default: `true`)
- `skipPaths`: Files/patterns to ignore when suggesting version bumps
