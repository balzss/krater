# Implementation Plan

This document provides a step-by-step implementation plan for pending features and improvements. Tasks are organized by priority and complexity.

## Task Status Legend
- `[ ]` TODO
- `[~]` IN PROGRESS
- `[x]` COMPLETED
- `[!]` BLOCKED
- `[-]` SKIPPED

---

## Priority 1: User Experience Improvements

### Task 1.1: Conditional Last.fm Stats Menu Item
**Status:** `[x]`

**Objective:** Hide the "Listening stats" menu item when user hasn't connected to Last.fm

**Implementation Steps:**
1. Read `src/app/MainPageContent.tsx` to understand current menu structure
2. Import `useLastFmConnection()` hook from `@/hooks/use-lastfm`
3. Destructure `isConnected` from the hook
4. Wrap the stats MenuItem in a conditional render: `{isConnected && <MenuItem...>}`
5. Ensure loading state is handled properly

**Files to Modify:**
- `src/app/MainPageContent.tsx`

**Acceptance Criteria:**
- Stats menu item only visible when Last.fm is connected
- No flash of content during loading
- Menu reorders smoothly when stats item appears/disappears

---

### Task 1.2: Collapsible Admin Login in Settings
**Status:** `[x]`

**Objective:** Convert admin login to a button that expands into full form on click

**Implementation Steps:**
1. Read `src/app/settings/page.tsx` to locate admin login section
2. Add state: `const [showAdminForm, setShowAdminForm] = useState(false)`
3. Create a button component that toggles `showAdminForm`
4. Wrap the existing form fields in conditional render: `{showAdminForm && <div>...form...</div>}`
5. Style button to match existing design (use MenuItem or similar)
6. Add smooth transition/animation for form expansion

**Files to Modify:**
- `src/app/settings/page.tsx`

**Acceptance Criteria:**
- Default state shows only a button (e.g., "Admin Login")
- Clicking button expands to show username/password fields
- Form state is preserved during toggle
- Button changes to "Hide" or similar when expanded

---

## Priority 2: Build & Configuration

### Task 2.1: Static Export Mode Limitations
**Status:** `[x]`

**Objective:** Disable Last.fm integration and admin login in static export mode

**Implementation Steps:**
1. Check `next.config.ts` for static export detection
2. Create environment variable or build-time constant: `IS_STATIC_EXPORT`
3. In `src/app/settings/page.tsx`:
   - Conditionally hide Last.fm connection section if `IS_STATIC_EXPORT`
   - Conditionally hide admin login section if `IS_STATIC_EXPORT`
   - Show informational message: "Feature not available in static mode"
4. In `src/app/MainPageContent.tsx`:
   - Conditionally hide stats menu item if `IS_STATIC_EXPORT`
5. Add check in API routes to return 501 if called in static mode (optional)

**Files to Modify:**
- `next.config.ts`
- `src/app/settings/page.tsx`
- `src/app/MainPageContent.tsx`
- Possibly: `src/lib/constants.ts` (add new constant)

**Acceptance Criteria:**
- Static export build hides Last.fm features
- Static export build hides admin login
- Dev mode and standard builds retain full functionality
- Clear messaging to users about disabled features

---

### Task 2.2: Update Husky Hook Configuration
**Status:** `[x]`

**Objective:** Update `.husky/pre-commit` to use latest Husky v9+ format

**Current Issue:** Hook uses deprecated format that will fail in v10.0.0
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
```

**Implementation Steps:**
1. Read `.husky/pre-commit` to see current structure
2. Remove deprecated lines:
   - Remove `#!/usr/bin/env sh`
   - Remove `. "$(dirname -- "$0")/_/husky.sh"`
3. Keep only the actual hook commands
4. Reference: https://typicode.github.io/husky/guide.html#create-a-hook
5. Test by running `git commit` to verify hook still works

**Files to Modify:**
- `.husky/pre-commit`

**Acceptance Criteria:**
- No deprecation warnings when committing
- All hook functionality preserved (lint, version bump, tests)
- Compatible with Husky v9 and v10

---

### Task 2.3: Replace next lint with Prettier
**Status:** `[x]`

**Objective:** Use Prettier for linting/formatting; auto-fix in pre-commit hook

**Implementation Steps:**
1. Read `package.json` scripts section
2. Modify `"lint"` script from `"next lint"` to `"prettier --check ."`
3. Add new script: `"lint:fix": "prettier --write ."`
4. Read `.husky/pre-commit` hook
5. Update pre-commit to run `npm run lint:fix` instead of just checking
6. Ensure staged files are automatically formatted before commit
7. Update `.prettierignore` if needed to exclude build artifacts
8. Consider adding `.prettierrc` configuration file for consistency

**Files to Modify:**
- `package.json`
- `.husky/pre-commit`
- Optionally: `.prettierrc`, `.prettierignore`

**Acceptance Criteria:**
- `npm run lint` checks formatting with Prettier
- `npm run lint:fix` auto-fixes all formatting issues
- Pre-commit hook auto-formats staged files
- No more ESLint-only linting; Prettier is source of truth
- All existing files pass Prettier check

---

## Priority 3: Testing & CI/CD

### Task 3.1: Fix Failing Tests
**Status:** `[ ]`

**Objective:** Resolve test failures (70 failed tests currently)

**Known Issues from Test Output:**
1. MSW handlers missing for `/api/auth/get-session`
2. `use-auth` tests timing out (isLoading stuck at true)
3. Unhandled request errors in MSW
4. Multiple test files affected: auth tests, library-data tests

**Implementation Steps:**
1. Read `src/__tests__/mocks/handlers.ts` to understand current MSW setup
2. Add missing handler for `/api/auth/get-session` endpoint
3. Read failing test files:
   - `src/__tests__/unit/hooks/use-auth.test.ts`
   - `src/__tests__/unit/hooks/use-library-data.test.ts`
4. Fix MSW configuration to handle all auth-related requests
5. Update test timeouts if necessary
6. Investigate why `isLoading` remains true in auth tests
7. Run tests with `npm run test:coverage` to verify fixes
8. Ensure coverage thresholds are still met

**Files to Modify:**
- `src/__tests__/mocks/handlers.ts`
- `src/__tests__/unit/hooks/use-auth.test.ts`
- Possibly other test files with failures

**Acceptance Criteria:**
- All 192 tests passing (100%)
- No unhandled request errors in MSW
- Test execution time under 5 seconds
- Coverage thresholds maintained

---

### Task 3.2: Fix Docker Build in GitHub Actions
**Status:** `[ ]`

**Objective:** Investigate and resolve failing Docker build in CI/CD pipeline

**Implementation Steps:**
1. Read `.github/workflows/` directory to find Docker-related workflows
2. Check recent GitHub Actions run logs for error messages
3. Read `Dockerfile` to understand build process
4. Common issues to check:
   - Node version mismatch
   - Missing environment variables in CI
   - Build context issues
   - Dependency installation failures
   - Next.js build errors in Docker environment
5. Test Docker build locally: `docker build -t krater .`
6. Fix identified issues
7. Update workflow file if necessary
8. Push changes and verify CI passes

**Files to Modify:**
- Possibly: `Dockerfile`
- Possibly: `.github/workflows/*.yml`
- Possibly: `.dockerignore`

**Acceptance Criteria:**
- Docker build completes successfully in GitHub Actions
- Image builds without errors locally
- CI/CD pipeline runs green
- Build time is reasonable (under 10 minutes)

---

## Priority 4: Housekeeping

### Task 4.1: Remove Codecov Badge from README
**Status:** `[x]`

**Objective:** Remove Codecov badge as it's no longer in use

**Implementation Steps:**
1. Read `README.md`
2. Search for Codecov badge markdown:
   - Look for `[![codecov]` or similar
   - Look for `https://codecov.io/` URLs
3. Remove the badge line(s)
4. Verify README still renders correctly
5. Ensure other badges remain intact

**Files to Modify:**
- `README.md`

**Acceptance Criteria:**
- Codecov badge removed from README
- Other badges (if any) remain functional
- README formatting intact
- Links and sections still work

---

## Implementation Order

Recommended order for maximum efficiency:

1. **Task 4.1** (Remove Codecov badge) - Quick win, 2 minutes
2. **Task 2.2** (Update Husky) - Prevents future issues, 5 minutes
3. **Task 2.3** (Prettier setup) - Improves code quality checks, 15 minutes
4. **Task 1.1** (Conditional stats menu) - User-facing improvement, 10 minutes
5. **Task 1.2** (Collapsible admin login) - UI enhancement, 20 minutes
6. **Task 2.1** (Static export mode) - Important for deployment, 30 minutes
7. **Task 3.1** (Fix tests) - Critical but time-consuming, 1-2 hours
8. **Task 3.2** (Fix Docker build) - Depends on understanding CI failures, 30-60 minutes

---

## Notes for AI Agents

- Always read files before modifying to understand current state
- Follow existing code style and patterns
- Update this plan with status as tasks are completed
- If blocked, document the blocker and move to next task
- Commit related changes together with descriptive messages
