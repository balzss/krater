# Scripts

This directory contains utility scripts for the project.

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
