# Implementation Plan

This document provides a detailed step-by-step implementation plan for the roadmap items identified in `ROADMAP.md`.

## Overview

The plan covers 5 main areas:
1. Chrome Extension Improvements (from audit)
2. UI Bug Fix (info button positioning)
3. JSON Editor Feature (library data editing)
4. UI Improvement (remove redundant artist info in modal)
5. Development Tooling (commit hook for version bumping)

---

## Task 1: Chrome Extension Improvements

**Priority:** High
**Complexity:** Complex
**Dependencies:** None

### Background
The Chrome Extension Audit identified 15 recommendations across high, medium, and low priority. We'll focus on implementing the most impactful improvements that enhance security, UX, and reliability.

### Implementation Steps

#### 1.1 Implement API Key Authentication
**File:** `chrome-extension/options.js`, `chrome-extension/content.js`

1. **Update options.js to save/load API key:**
   - Modify `saveOptions()` to include `apiKey` in chrome.storage.sync
   - Modify `restoreOptions()` to load `apiKey` with empty string default
   - Ensure API key is stored securely

2. **Update content.js to use API key in headers:**
   - Create helper function to load API key from storage
   - Modify `checkArtistsAndRelease()` to include Authorization header
   - Modify `addArtists()` to include Authorization header
   - Modify `addRelease()` to include Authorization header
   - Modify `removeRelease()` to include Authorization header
   - Format: `Authorization: Bearer ${apiKey}` (if apiKey exists)

3. **Testing:**
   - Test with API key set
   - Test without API key (should still work for backwards compatibility)
   - Verify headers are sent correctly

#### 1.2 Replace Alert Dialogs with Toast Notifications
**Files:** `chrome-extension/manifest.json`, `chrome-extension/background.js`, `chrome-extension/content.js`

1. **Update manifest.json:**
   - Add `"notifications"` to permissions array

2. **Enhance background.js:**
   - Add message listener for notification requests
   - Implement `showNotification()` handler using chrome.notifications.create()
   - Use appropriate icon from images folder

3. **Update content.js:**
   - Create `showNotification()` helper function that sends message to background
   - Replace all `alert()` calls with `showNotification()` calls
   - Update error handling to use notifications instead of alerts
   - Keep confirmation dialogs (window.confirm) for destructive actions

4. **Testing:**
   - Test success notifications (add, remove, refresh)
   - Test error notifications (API failures, network issues)
   - Verify notifications appear and disappear correctly

#### 1.3 Add Offline Detection and Retry Logic
**File:** `chrome-extension/content.js`

1. **Create fetchWithRetry utility function:**
   - Check `navigator.onLine` before attempting fetch
   - Implement timeout using AbortController (10 second default)
   - Implement retry logic with exponential backoff (3 retries default)
   - Handle HTTP status codes appropriately
   - Throw descriptive errors

2. **Update all fetch calls:**
   - Replace `fetch()` with `fetchWithRetry()` in:
     - `checkArtistsAndRelease()`
     - `addArtists()`
     - `addRelease()`
     - `removeRelease()`
   - Update error handling to show user-friendly offline messages

3. **Testing:**
   - Test with network offline
   - Test with slow network (throttling)
   - Test retry behavior on transient failures
   - Verify timeout behavior

#### 1.4 Enforce HTTPS for API URLs
**File:** `chrome-extension/options.js`

1. **Add validation in saveOptions():**
   - Parse API URL using URL constructor
   - Check protocol is HTTPS
   - Allow HTTP only for localhost/127.0.0.1
   - Show clear error message if validation fails
   - Prevent saving invalid URLs

2. **Testing:**
   - Test saving HTTPS URL (should succeed)
   - Test saving HTTP non-localhost URL (should fail)
   - Test saving HTTP localhost URL (should succeed)
   - Test invalid URL format (should fail)

#### 1.5 Dynamic UI Updates (Remove Page Reload)
**File:** `chrome-extension/content.js`

1. **Refactor button state management:**
   - Extract button creation/update logic into reusable functions
   - Create `updateButtonState()` function to change button without reload
   - Update button text, class, and event handlers dynamically

2. **Update action handlers:**
   - Modify `addRelease()` success: update button to "Remove from Krater" state
   - Modify `removeRelease()` success: update button to "Add to Krater" state
   - Remove `location.reload()` calls
   - Update refresh button visibility dynamically

3. **Testing:**
   - Test add operation (button should change without reload)
   - Test remove operation (button should change without reload)
   - Test refresh operation
   - Verify scroll position is maintained
   - Verify page state is preserved

#### 1.6 Add JSDoc Comments
**File:** `chrome-extension/content.js`

1. **Document all functions with JSDoc:**
   - `checkArtistsAndRelease()` - document params, return type, purpose
   - `addArtists()` - document params, return type, purpose
   - `addRelease()` - document params, return type, purpose
   - `removeRelease()` - document params, return type, purpose
   - `getArtistAndReleaseInfo()` - document return type, purpose
   - `loadKrater()` - document purpose, behavior
   - Helper functions (button creation, etc.)

2. **Add file-level documentation:**
   - Add header comment describing extension purpose
   - Document key dependencies
   - Document browser compatibility

3. **Testing:**
   - Run JSDoc generator to verify valid syntax
   - Review generated documentation for clarity

#### 1.7 Refactor Magic Numbers to Constants
**File:** `chrome-extension/content.js`

1. **Create constants object:**
   ```javascript
   const TIMEOUTS = {
     SUCCESS_MESSAGE: 1500,
     ERROR_MESSAGE: 3000,
     API_REQUEST: 10000,
     RETRY_DELAY_BASE: 1000
   }
   ```

2. **Replace hardcoded values:**
   - Replace 1500ms with `TIMEOUTS.SUCCESS_MESSAGE`
   - Replace 3000ms with `TIMEOUTS.ERROR_MESSAGE`
   - Use in setTimeout calls
   - Use in fetchWithRetry function

3. **Testing:**
   - Verify timing behavior unchanged
   - Verify all magic numbers replaced

### Deliverables
- Updated chrome-extension files with all improvements
- No page reloads on add/remove actions
- Toast notifications instead of alerts
- Retry logic for network failures
- HTTPS enforcement for security
- API key authentication support
- Well-documented code with JSDoc
- Constants instead of magic numbers

### Testing Checklist
- [ ] API key authentication works
- [ ] Toast notifications appear correctly
- [ ] Offline detection shows appropriate message
- [ ] Retry logic works on transient failures
- [ ] HTTPS validation prevents insecure URLs
- [ ] UI updates without page reload
- [ ] All existing functionality still works
- [ ] Extension loads on RYM pages
- [ ] Add/remove/refresh operations succeed
- [ ] Error handling is user-friendly

---

## Task 2: Fix Info Button Position

**Priority:** Medium
**Complexity:** Simple
**Dependencies:** None

### Background
The info button on release tiles is misplaced and overflowing. It should be positioned in the bottom right corner of the tile content area but is barely visible due to CSS issues.

### Problem Analysis
In `src/components/music-tile.tsx` (lines 97-104):
- Button uses `self-end` to align to bottom
- Button uses negative margins `-mr-2 -mb-2` which may cause overflow
- Button is positioned relative to flex container which may not provide correct positioning

### Implementation Steps

#### 2.1 Analyze Current Layout
**File:** `src/components/music-tile.tsx`

1. **Examine the structure:**
   - Parent div with padding (line 74)
   - Flex container for artist text and button (line 82)
   - Button with self-end and negative margins (line 98-103)

2. **Identify the issue:**
   - Negative margins causing button to overflow
   - Flex layout may not provide desired absolute positioning
   - `self-end` aligns to end of flex container, not the tile

#### 2.2 Implement Fix

**Option A: Use absolute positioning**
```tsx
// Update the parent container (line 74)
<div className={`${compact ? 'p-2' : 'p-4'} relative`}>

  // Update button (lines 98-104)
  <ActionButton
    onClick={() => setIsModalOpen(true)}
    icon={BadgeInfo}
    className={`absolute bottom-2 right-2 text-gray-600 ${showInfoBtn || isTouchDevice ? 'opacity-100' : 'opacity-0'} transition duration-150 hover:bg-gray-100`}
    size={20}
  />
</div>
```

**Option B: Improve flex positioning**
```tsx
// Keep current structure but fix margins
<ActionButton
  onClick={() => setIsModalOpen(true)}
  icon={BadgeInfo}
  className={`text-gray-600 ml-2 ${showInfoBtn || isTouchDevice ? 'opacity-100' : 'opacity-0'} transition duration-150 hover:bg-gray-100`}
  size={20}
/>
```

#### 2.3 Implementation Choice
Use **Option A (absolute positioning)** because:
- Guarantees button stays in bottom-right corner
- Doesn't interfere with text layout
- Matches the expected behavior described in roadmap
- More reliable across different text lengths

#### 2.4 Code Changes
**File:** `src/components/music-tile.tsx`

1. **Update parent div (line 74):**
   - Add `relative` class to enable absolute positioning context

2. **Update button (lines 98-104):**
   - Replace `self-end -mr-2 -mb-2` with `absolute bottom-2 right-2`
   - Keep opacity and transition classes
   - Keep hover styles

3. **Update text container (line 83):**
   - Add `pr-8` or `pr-10` to prevent text from overlapping button area
   - Ensure adequate spacing when button is visible

#### 2.5 Testing

1. **Visual testing:**
   - Verify button appears in bottom-right corner
   - Check button visibility on hover
   - Test on touch devices (button should be visible)
   - Verify button doesn't overlap artist text
   - Test with long artist names
   - Test with multiple artists

2. **Responsive testing:**
   - Test on mobile viewport
   - Test on tablet viewport
   - Test on desktop viewport
   - Verify compact mode still works

3. **Interaction testing:**
   - Click button to open modal
   - Verify hover state works
   - Check opacity transition is smooth

### Deliverables
- Fixed info button positioning in bottom-right corner
- No overflow or visibility issues
- Text doesn't overlap with button
- Works in both standard and compact modes

### Testing Checklist
- [ ] Button visible in bottom-right corner
- [ ] Button appears on hover (desktop)
- [ ] Button visible on touch devices
- [ ] No overlap with artist text
- [ ] Works with long artist names
- [ ] Works in compact mode
- [ ] Modal opens on click
- [ ] Transition animation smooth

---

## Task 3: JSON Editor Feature

**Priority:** High
**Complexity:** Very Complex
**Dependencies:** None

### Background
The settings page has a placeholder for editing library data (line 177-179 in `src/app/settings/page.tsx`). We need to implement a full-featured JSON editor using svelte-jsoneditor with validation.

### Library Research: svelte-jsoneditor

The library supports:
- Tree view and text view modes
- Validation with JSON Schema
- Search and replace
- Undo/redo
- Dark mode support
- Can be used in React with wrapper

**GitHub:** https://github.com/josdejong/svelte-jsoneditor

### Implementation Steps

#### 3.1 Install Dependencies

1. **Install svelte-jsoneditor:**
   ```bash
   npm install svelte-jsoneditor
   ```

2. **Install peer dependencies (if needed):**
   ```bash
   npm install svelte
   ```

3. **Verify installation:**
   - Check package.json for added dependencies
   - Run `npm run build` to ensure no conflicts

#### 3.2 Create JSON Schema for Validation

**File:** `src/lib/schemas/library-schema.ts`

1. **Define JSON Schema for LibraryData:**
   ```typescript
   export const libraryDataSchema = {
     type: 'object',
     required: ['releases', 'artists'],
     properties: {
       releases: {
         type: 'array',
         items: {
           type: 'object',
           required: ['artistRymIds', 'title', 'rymId', 'cover', 'media'],
           properties: {
             artistRymIds: {
               type: 'array',
               items: { type: 'string' },
               minItems: 1
             },
             title: { type: 'string', minLength: 1 },
             rymId: { type: 'string', minLength: 1 },
             rymUrl: { type: 'string', format: 'uri' },
             cover: { type: 'string', minLength: 1 },
             media: {
               type: 'object',
               properties: {
                 spotify: { type: 'string', format: 'uri' },
                 appleMusic: { type: 'string', format: 'uri' },
                 youtubeMusic: { type: 'string', format: 'uri' },
                 tidal: { type: 'string', format: 'uri' },
                 bandcamp: { type: 'string', format: 'uri' }
               }
             }
           }
         }
       },
       artists: {
         type: 'array',
         items: {
           type: 'object',
           required: ['displayName', 'rymId'],
           properties: {
             displayName: { type: 'string', minLength: 1 },
             rymId: { type: 'string', minLength: 1 },
             rymUrl: { type: 'string', format: 'uri' }
           }
         }
       }
     }
   }
   ```

2. **Export schema for use in editor**

#### 3.3 Create JSON Editor Component

**File:** `src/components/json-editor.tsx`

1. **Create React wrapper for svelte-jsoneditor:**
   ```typescript
   'use client'

   import { useEffect, useRef, useState } from 'react'
   import { JSONEditor, Mode, Content, OnChangeStatus } from 'svelte-jsoneditor'
   import type { JSONSchemaType } from 'svelte-jsoneditor'

   interface JsonEditorProps {
     content: Content
     onChange: (content: Content, status: OnChangeStatus) => void
     schema?: JSONSchemaType
     readOnly?: boolean
     mode?: Mode
   }

   export function JsonEditor({ content, onChange, schema, readOnly = false, mode = Mode.tree }: JsonEditorProps) {
     const editorRef = useRef<HTMLDivElement>(null)
     const editorInstance = useRef<JSONEditor | null>(null)

     // Component implementation
   }
   ```

2. **Implement lifecycle methods:**
   - Initialize editor in useEffect
   - Handle content updates
   - Handle theme changes
   - Cleanup on unmount

3. **Add error handling:**
   - Catch editor initialization errors
   - Display user-friendly error messages
   - Handle validation errors

4. **Add TypeScript types:**
   - Import necessary types from svelte-jsoneditor
   - Define component props interface
   - Type editor instance

#### 3.4 Create JSON Editor Modal/Page

**File:** `src/components/json-editor-modal.tsx`

1. **Create modal component:**
   - Use Radix UI Dialog (consistent with ReleaseModal)
   - Include JsonEditor component
   - Add save/cancel buttons
   - Show validation status
   - Display error messages

2. **Implement state management:**
   - Track editor content
   - Track validation status
   - Track dirty state (unsaved changes)
   - Handle save operation

3. **Add validation feedback:**
   - Show validation errors inline
   - Disable save button if invalid
   - Show warning for unsaved changes
   - Confirm before closing with unsaved changes

4. **Implement save logic:**
   - Validate data against schema
   - Call API to save library data
   - Handle success/error responses
   - Close modal on success
   - Show error message on failure

#### 3.5 Integrate into Settings Page

**File:** `src/app/settings/page.tsx`

1. **Import JsonEditorModal component**

2. **Add state for modal:**
   ```typescript
   const [isEditorOpen, setIsEditorOpen] = useState(false)
   ```

3. **Update "Edit library" MenuItem (line 177-179):**
   ```typescript
   <MenuItem
     startIcon={FilePenLine}
     onClick={() => setIsEditorOpen(true)}
   >
     Edit library
   </MenuItem>
   ```

4. **Add modal to page:**
   ```typescript
   <JsonEditorModal
     isOpen={isEditorOpen}
     onClose={() => setIsEditorOpen(false)}
     onSave={handleSaveLibraryData}
   />
   ```

5. **Implement handleSaveLibraryData:**
   - Validate data
   - Call API endpoint
   - Refresh library data on success
   - Show success/error notification

#### 3.6 Add CSS Styles

**File:** Create `src/styles/json-editor.css` or add to global styles

1. **Import svelte-jsoneditor styles:**
   ```css
   @import 'svelte-jsoneditor/themes/jse-theme-default.css';
   @import 'svelte-jsoneditor/themes/jse-theme-dark.css';
   ```

2. **Add custom styles:**
   - Adjust editor height
   - Style modal container
   - Theme-specific overrides
   - Ensure editor is fully visible

3. **Import in layout or component**

#### 3.7 Add API Validation (Server-side)

**File:** `src/app/api/library-data/route.ts`

1. **Install ajv for server-side validation:**
   ```bash
   npm install ajv
   ```

2. **Create validation function:**
   ```typescript
   import Ajv from 'ajv'
   import addFormats from 'ajv-formats'
   import { libraryDataSchema } from '@/lib/schemas/library-schema'

   const ajv = new Ajv()
   addFormats(ajv)
   const validate = ajv.compile(libraryDataSchema)
   ```

3. **Validate in PUT handler:**
   - Parse request body
   - Run validation
   - Return 400 with errors if invalid
   - Proceed with save if valid

4. **Add additional business logic validation:**
   - Check for duplicate release rymIds
   - Verify artist references exist
   - Check cover files exist
   - Return detailed error messages

#### 3.8 Testing

1. **Unit tests for validation:**
   - Create test file: `src/__tests__/unit/library-schema.test.ts`
   - Test valid library data passes validation
   - Test invalid data fails validation
   - Test edge cases (empty arrays, missing fields)

2. **Component tests:**
   - Create test file: `src/__tests__/components/json-editor.test.tsx`
   - Test editor renders
   - Test validation feedback
   - Test save/cancel actions
   - Test dirty state tracking

3. **Integration tests:**
   - Test API validation endpoint
   - Test save operation end-to-end
   - Test error handling

4. **Manual testing:**
   - Open editor from settings
   - Edit valid JSON
   - Try to save invalid JSON
   - Verify validation errors appear
   - Save valid changes
   - Verify data persists
   - Test theme switching
   - Test undo/redo
   - Test search functionality

### Deliverables
- Fully functional JSON editor integrated into settings page
- Client-side and server-side validation
- JSON Schema for library data structure
- User-friendly error messages
- Save/cancel/unsaved changes handling
- Dark mode support
- Search, undo/redo functionality
- Comprehensive test coverage

### Testing Checklist
- [ ] Editor opens from settings page
- [ ] Editor loads current library data
- [ ] Validation works (rejects invalid data)
- [ ] Validation errors are clear and helpful
- [ ] Can edit releases array
- [ ] Can edit artists array
- [ ] Can add new releases/artists
- [ ] Can remove releases/artists
- [ ] Save button disabled when invalid
- [ ] Save operation persists changes
- [ ] API validates data server-side
- [ ] Error handling works
- [ ] Unsaved changes warning works
- [ ] Dark mode supported
- [ ] Search works
- [ ] Undo/redo works
- [ ] Modal can be closed
- [ ] No data loss on cancel

---

## Task 4: Remove Redundant Artist Info

**Priority:** Low
**Complexity:** Simple
**Dependencies:** None

### Background
The release modal displays artist names in two places:
1. Line 74-76: In the Dialog.Description (below title)
2. Lines 90-108: In the details section (as "Artists:" field)

This is redundant and clutters the UI. We should only keep the artist information in the details section where it's clickable and properly formatted.

### Implementation Steps

#### 4.1 Analyze Current Implementation
**File:** `src/components/release-modal.tsx`

1. **Identify redundant section (lines 74-76):**
   ```tsx
   <Dialog.Description className="text-base text-(--foreground) opacity-70">
     {artistNames}
   </Dialog.Description>
   ```

2. **Identify section to keep (lines 90-108):**
   ```tsx
   <dt className="font-semibold text-(--foreground) opacity-70">Artists:</dt>
   <dd className="text-(--foreground)">
     {artists.map((artist, index) => (
       // clickable links to artist pages
     ))}
   </dd>
   ```

#### 4.2 Implement Changes

1. **Remove redundant Dialog.Description (lines 74-76):**
   - Delete the entire block
   - Remove `artistNames` variable if no longer used (line 39)

2. **Adjust spacing:**
   - Check if gap between header and cover needs adjustment
   - Modal gap is set at line 62: `flex flex-col gap-4`
   - Should look natural without the description

3. **Verify no accessibility issues:**
   - Dialog.Title is still present (good for screen readers)
   - Artist information is still in the DOM (in details section)
   - Links are accessible and keyboard-navigable

#### 4.3 Code Changes
**File:** `src/components/release-modal.tsx`

```tsx
// Remove line 39 (if artistNames not used elsewhere):
// const artistNames = artists.map((a) => a?.displayName || 'Unknown').join(', ')

// Remove lines 74-76:
// <Dialog.Description className="text-base text-(--foreground) opacity-70">
//   {artistNames}
// </Dialog.Description>

// Keep header section (lines 64-72):
<div className="flex items-start justify-between">
  <Dialog.Title className="text-2xl font-bold text-(--foreground) pr-8">
    {release.title}
  </Dialog.Title>
  <Dialog.Close>
    {/* ... */}
  </Dialog.Close>
</div>

// Cover image follows immediately (lines 78-86)
// Details section with artist links remains (lines 89-108)
```

#### 4.4 Testing

1. **Visual testing:**
   - Open release modal
   - Verify title displays correctly
   - Verify cover art displays
   - Verify artists section below cover has clickable links
   - Check spacing looks natural
   - Test with single artist
   - Test with multiple artists

2. **Responsive testing:**
   - Test on mobile viewport
   - Test on tablet viewport
   - Test on desktop viewport
   - Verify modal layout remains centered

3. **Accessibility testing:**
   - Test keyboard navigation
   - Test screen reader (title should be announced)
   - Verify artist links are focusable
   - Check color contrast for artist links

### Deliverables
- Cleaner release modal with artist info only in details section
- No visual or functional regressions
- Maintained accessibility

### Testing Checklist
- [ ] Modal opens correctly
- [ ] Title displays at top
- [ ] No redundant artist text below title
- [ ] Cover image displays correctly
- [ ] Artists section below cover shows clickable links
- [ ] Links navigate to correct artist filter
- [ ] Spacing looks natural
- [ ] Works on all screen sizes
- [ ] Keyboard navigation works
- [ ] Screen reader announces title

---

## Task 5: Version Bump Commit Hook

**Priority:** Medium
**Complexity:** Moderate
**Dependencies:** None

### Background
We need an automated commit hook that analyzes changes and intelligently bumps the version number in package.json according to semantic versioning principles. The hook will also run linting checks to ensure code quality before allowing the version bump to proceed.

### Semantic Versioning Review
- **MAJOR (x.0.0):** Breaking changes, incompatible API changes
- **MINOR (0.x.0):** New features, backwards-compatible functionality
- **PATCH (0.0.x):** Bug fixes, backwards-compatible fixes

### Linting Integration
The version bump script will run `npm run lint` before prompting for version bump:
- **Purpose:** Ensure all code passes linting before version is incremented
- **Behavior:** If lint fails, version bump is aborted and commit is cancelled
- **Skip option:** Can be bypassed with `--no-lint` flag or configuration
- **User feedback:** Clear error messages showing which linting rules failed

### Implementation Steps

#### 5.1 Design Hook Strategy

**Decision Points:**
1. **Which hook to use:**
   - `prepare-commit-msg` - runs before commit message editor (allows analysis of staged changes)
   - `pre-commit` - runs before commit is created (existing hook in project)
   - **Choice:** `prepare-commit-msg` - can analyze changes and prompt user if needed

2. **Bump strategy:**
   - **Automatic:** Analyze commit message/files changed to determine bump type
   - **Interactive:** Prompt user to select bump type
   - **Hybrid:** Suggest bump type based on analysis, allow override
   - **Choice:** Hybrid approach - smart suggestions with user confirmation

3. **Analysis method:**
   - Analyze commit message for keywords (feat:, fix:, BREAKING CHANGE:)
   - Analyze file changes (API routes = minor, bug fixes = patch)
   - Combine both signals for best accuracy

#### 5.2 Create Version Bump Script

**File:** `scripts/bump-version.js`

1. **Create Node.js script:**
   ```javascript
   #!/usr/bin/env node

   const fs = require('fs')
   const { execSync } = require('child_process')
   const readline = require('readline')

   // Script implementation
   ```

2. **Implement version bump logic:**
   - Read current version from package.json
   - Parse semantic version (major.minor.patch)
   - Implement bump functions (bumpMajor, bumpMinor, bumpPatch)
   - Write updated version back to package.json

3. **Implement change analysis:**
   - Get staged files: `git diff --cached --name-only`
   - Get commit message (if provided)
   - Analyze commit message for conventional commit keywords:
     - `BREAKING CHANGE:` or `!` → major
     - `feat:` → minor
     - `fix:` → patch
   - Analyze files changed:
     - API route changes → potentially minor
     - Test-only changes → patch
     - Documentation → patch
     - Component changes → depends on context

4. **Implement suggestion logic:**
   ```javascript
   function suggestBumpType(commitMsg, files) {
     // Check commit message first
     if (commitMsg.includes('BREAKING CHANGE') || commitMsg.includes('!:')) {
       return 'major'
     }
     if (commitMsg.startsWith('feat:') || commitMsg.startsWith('feat(')) {
       return 'minor'
     }
     if (commitMsg.startsWith('fix:') || commitMsg.startsWith('fix(')) {
       return 'patch'
     }

     // Analyze files
     const hasApiChanges = files.some(f => f.includes('api/'))
     const hasNewComponents = files.some(f => f.includes('components/') && isNewFile(f))

     if (hasNewComponents) return 'minor'
     if (hasApiChanges) return 'minor'

     return 'patch' // default
   }
   ```

5. **Implement interactive prompt:**
   ```javascript
   async function promptUser(suggestion) {
     const rl = readline.createInterface({
       input: process.stdin,
       output: process.stdout
     })

     return new Promise((resolve) => {
       rl.question(
         `Suggested version bump: ${suggestion}\nSelect bump type (major/minor/patch/skip) [${suggestion}]: `,
         (answer) => {
           rl.close()
           resolve(answer.trim() || suggestion)
         }
       )
     })
   }
   ```

6. **Implement main flow:**
   - Parse command line arguments
   - Get staged changes
   - Analyze changes
   - Prompt user (if interactive)
   - Bump version
   - Stage package.json
   - Exit with appropriate code

7. **Handle edge cases:**
   - No staged changes
   - Invalid bump type
   - User cancels (skip)
   - package.json doesn't exist
   - Git not available
   - Non-interactive mode (CI)

#### 5.3 Add Linting Check to Version Bump Script

**File:** `scripts/bump-version.js`

1. **Add lint check function:**
   ```javascript
   function runLint() {
     console.log('Running lint check...')
     try {
       execSync('npm run lint', { stdio: 'inherit' })
       return true
     } catch (error) {
       console.error('\n❌ Lint check failed!')
       console.error('Please fix linting errors before committing.')
       console.error('You can run "npm run lint" to see all errors.')
       return false
     }
   }
   ```

2. **Integrate lint check into main flow:**
   - Run lint check before prompting for version bump
   - If lint fails, abort the version bump process
   - Provide option to skip lint via CLI flag: `--no-lint`
   - Add configuration in package.json to enable/disable lint check

3. **Add CLI argument parsing:**
   ```javascript
   const args = process.argv.slice(2)
   const skipLint = args.includes('--no-lint')
   const commitMsg = args.find(arg => !arg.startsWith('--'))
   ```

4. **Update main flow:**
   ```javascript
   async function main() {
     // Check if linting should run
     if (!skipLint && config.lintBeforeBump !== false) {
       const lintPassed = runLint()
       if (!lintPassed) {
         console.error('\nVersion bump cancelled due to lint errors.')
         process.exit(1)
       }
       console.log('✅ Lint check passed!\n')
     }

     // Continue with version bump logic...
   }
   ```

#### 5.4 Create Git Hook

**File:** `.husky/prepare-commit-msg`

1. **Create prepare-commit-msg hook:**
   ```bash
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   # Get commit message file
   COMMIT_MSG_FILE=$1
   COMMIT_SOURCE=$2

   # Skip if this is an amend, merge, or rebase
   if [ "$COMMIT_SOURCE" = "merge" ] || [ "$COMMIT_SOURCE" = "squash" ]; then
     exit 0
   fi

   # Only run on regular commits
   if [ -z "$COMMIT_SOURCE" ]; then
     # Read commit message (if provided via -m)
     COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

     # Run version bump script (includes linting)
     node scripts/bump-version.js "$COMMIT_MSG"

     # If script failed, abort commit
     if [ $? -ne 0 ]; then
       echo "Version bump failed or was cancelled"
       exit 1
     fi
   fi
   ```

2. **Make hook executable:**
   ```bash
   chmod +x .husky/prepare-commit-msg
   ```

3. **Note on existing pre-commit hook:**
   - The project already has a pre-commit hook
   - Consider whether linting should run in pre-commit or prepare-commit-msg
   - **Recommendation:** Keep linting in prepare-commit-msg as part of version bump
   - This ensures code is clean before version is bumped
   - If linting is already in pre-commit, make it optional in version bump script

#### 5.5 Add Configuration

**File:** `package.json`

1. **Add version bump configuration:**
   ```json
   {
     "versionBump": {
       "enabled": true,
       "interactive": true,
       "lintBeforeBump": true,
       "skipPaths": [
         "README.md",
         "docs/**",
         "**/*.test.ts",
         "**/*.test.tsx"
       ]
     }
   }
   ```

2. **Add npm scripts:**
   ```json
   {
     "scripts": {
       "version:bump": "node scripts/bump-version.js",
       "version:bump:no-lint": "node scripts/bump-version.js --no-lint",
       "version:major": "node scripts/bump-version.js major",
       "version:minor": "node scripts/bump-version.js minor",
       "version:patch": "node scripts/bump-version.js patch"
     }
   }
   ```

3. **Configuration options:**
   - `enabled`: Enable/disable version bumping
   - `interactive`: Prompt user or use automatic detection
   - `lintBeforeBump`: Run linting before version bump (default: true)
   - `skipPaths`: Files that don't trigger version bump

#### 5.6 Update Documentation

**File:** `CLAUDE.md`

1. **Add section on version management:**
   ```markdown
   ## Version Management

   The project uses automated version bumping via git hooks. When you commit:

   1. The hook runs linting to ensure code quality
   2. Analyzes your changes and commit message
   3. Suggests a version bump type (major/minor/patch)
   4. Prompts for confirmation
   5. Updates package.json automatically

   **Conventional Commit Format:**
   - `feat: description` → minor bump
   - `fix: description` → patch bump
   - `feat!: description` or with `BREAKING CHANGE:` → major bump

   **Manual version bumping:**
   ```bash
   npm run version:major       # 1.0.0 → 2.0.0
   npm run version:minor       # 1.0.0 → 1.1.0
   npm run version:patch       # 1.0.0 → 1.0.1
   npm run version:bump:no-lint # Skip lint check
   ```

   **Skipping version bump:**
   - Select "skip" when prompted
   - Or use `git commit --no-verify`

   **Skipping lint check:**
   - Use `npm run version:bump:no-lint` for manual bumps
   - Or set `lintBeforeBump: false` in package.json config
   ```

2. **Update development guidelines:**
   - Recommend using conventional commit format
   - Explain when to use major/minor/patch
   - Document lint check behavior
   - Explain skip options

#### 5.7 Testing

1. **Unit tests for bump script:**
   - Create test file: `scripts/__tests__/bump-version.test.js`
   - Test version parsing
   - Test bump functions (major, minor, patch)
   - Test suggestion logic
   - Test lint check function
   - Test CLI argument parsing
   - Test edge cases

2. **Integration tests:**
   - Test hook triggers on commit
   - Test with different commit messages
   - Test with different file changes
   - Test skip functionality
   - Test manual npm scripts
   - Test lint check integration
   - Test --no-lint flag

3. **Manual testing:**
   - Make a feat commit (should run lint then suggest minor)
   - Make a fix commit (should run lint then suggest patch)
   - Make a breaking change commit (should suggest major)
   - Test with failing lint (should abort)
   - Test skipping version bump
   - Test skipping lint check (--no-lint)
   - Test --no-verify bypass
   - Verify package.json updated correctly
   - Verify version in git log
   - Test lint check feedback is clear

### Deliverables
- Automated version bumping on commit
- Integrated linting before version bump
- Intelligent analysis of changes
- Interactive prompts with suggestions
- Support for conventional commits
- Configuration options (including lint toggle)
- Manual bump scripts with lint options
- Updated documentation
- Test coverage

### Testing Checklist
- [ ] Hook triggers on regular commits
- [ ] Hook skips on merge/rebase commits
- [ ] Lint check runs before version bump
- [ ] Lint failures prevent version bump
- [ ] Lint check can be skipped with --no-lint
- [ ] Analyzes commit message correctly
- [ ] Suggests appropriate bump type
- [ ] Interactive prompt works
- [ ] User can override suggestion
- [ ] User can skip bump
- [ ] package.json updated correctly
- [ ] Changes staged automatically
- [ ] --no-verify bypasses hook
- [ ] Manual npm scripts work
- [ ] Manual scripts support --no-lint flag
- [ ] Configuration options work (lintBeforeBump)
- [ ] Documentation clear and complete
- [ ] Works in non-interactive mode (CI)
- [ ] Lint error messages are helpful

---

## Implementation Order

**Recommended sequence to minimize conflicts and dependencies:**

1. **Task 4: Remove Redundant Artist Info** (Simple, isolated change)
2. **Task 2: Fix Info Button Position** (Simple UI fix)
3. **Task 5: Version Bump Commit Hook** (Enables proper versioning for remaining tasks)
4. **Task 3: JSON Editor Feature** (Complex feature, can test version bumping)
5. **Task 1: Chrome Extension Improvements** (Complex, can be done in parallel)

**Parallel work opportunities:**
- Task 1 (Chrome Extension) and Task 3 (JSON Editor) can be worked on simultaneously as they don't overlap
- Tasks 2 and 4 can be combined in a single commit if desired

---

## Post-Implementation

### Verification Steps
1. Run full test suite: `npm run test:all`
2. Run linting: `npm run lint`
3. Build production: `npm run build`
4. Manual testing of all changed features
5. Update MASTER_PLAN.md task statuses
6. Update ROADMAP.md to mark completed items

### Documentation Updates
1. Update CLAUDE.md with new features
2. Add JSON editor usage to README
3. Document chrome extension improvements
4. Update version management docs
5. Add any new development guidelines

### Release Preparation
1. Test static export: `npm run export`
2. Verify all changes work in production build
3. Create release notes summarizing changes
4. Tag release with new version
5. Deploy to production

---

## Notes

- All changes should follow the testing strategy established in Phase 1
- Maintain 80%+ test coverage for new code
- Run pre-commit hooks before committing
- Use conventional commit messages
- Update MASTER_PLAN.md as tasks progress
- Document any deviations from this plan

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
**Status:** Ready for implementation
