# Integration Tests Implementation Plan

**Status:** Not Started
**Total Tests Required:** 82 tests across 7 API route files
**Estimated Effort:** 12-16 hours
**Dependencies:** Section 1.1 ✅, Section 1.2 ✅

---

## Overview

Integration tests verify the complete request/response cycle for each API endpoint, including:
- Request parsing and validation
- Business logic execution
- Data persistence via mocked file system
- Error handling and edge cases
- Response format and status codes

---

## Test Files to Create

### 1. `src/__tests__/integration/api/releases.test.ts` (21 tests)

**GET /api/releases** (2 tests)
- Should return all releases (200)
- Should return 500 on server error

**POST /api/releases** (9 tests)
- Should create new release with valid data (201)
- Should reject duplicate rymId (400)
- Should reject missing required fields (400)
- Should handle cover file upload
- Should normalize unicode in cover filenames
- Should reject invalid JSON in artistRymIds (400)
- Should reject invalid JSON in media (400)
- Should reject empty artistRymIds array (400)
- Should call ensureDirectoryExists for covers

**PUT /api/releases** (7 tests)
- Should update existing release (200)
- Should return 404 for non-existent release
- Should handle cover replacement
- Should delete old cover when filename changes
- Should preserve original values for unspecified fields
- Should handle unicode normalization
- Should reject missing rymId (400)

**DELETE /api/releases** (3 tests)
- Should delete release by rymId (200)
- Should delete associated cover file
- Should return 404 for non-existent release
- Should require rymId parameter (400)

**Mocking Strategy:**
```typescript
vi.mock('@/lib/server')
vi.mock('fs/promises')

// Mock all server functions
vi.mocked(serverLib.getReleases).mockResolvedValue(mockLibraryData.releases)
vi.mocked(serverLib.updateReleases).mockResolvedValue(undefined)
vi.mocked(serverLib.deleteCoverFile).mockResolvedValue(undefined)
vi.mocked(serverLib.ensureDirectoryExists).mockResolvedValue(undefined)
```

---

### 2. `src/__tests__/integration/api/artists.test.ts` (16 tests)

**GET /api/artists** (2 tests)
- Should return all artists (200)
- Should return 500 on server error

**POST /api/artists** (6 tests)
- Should create single artist (201)
- Should create multiple artists (201)
- Should skip duplicate artists
- Should reject invalid artist data (400)
- Should reject empty request body (400)
- Should return skipped artists in response

**PUT /api/artists** (5 tests)
- Should update single artist (200)
- Should update multiple artists (200)
- Should return 404 for non-existent artist
- Should require rymId field (400)
- Should handle partial updates

**DELETE /api/artists** (3 tests)
- Should delete artist by rymId (200)
- Should return 404 for non-existent artist
- Should require rymId parameter (400)

---

### 3. `src/__tests__/integration/api/library-data.test.ts` (8 tests)

**GET /api/library-data** (2 tests)
- Should return library data with timestamp (200)
- Should return 500 on file read error

**POST /api/library-data** (6 tests)
- Should save library data (200)
- Should return 400 on empty body
- Should return 400 on invalid JSON
- Should return success timestamp
- Should validate data structure
- Should handle write errors (500)

---

### 4. `src/__tests__/integration/api/health.test.ts` (12 tests)

**GET /api/health** (12 tests)
- Should detect unused covers
- Should detect unused artists
- Should detect missing covers
- Should detect missing artists
- Should return empty arrays when no issues
- Should handle missing covers directory
- Should map artist names to missing covers
- Should list releases using missing artists
- Should return proper status codes (200)
- Should include timestamp in response
- Should handle file system errors (500)
- Should require admin authentication (via middleware)

---

### 5. `src/__tests__/integration/api/auth.test.ts` (15 tests)

**POST /api/auth/login** (6 tests)
- Should succeed with valid secret (200)
- Should fail with invalid secret (401)
- Should set httpOnly cookie on success
- Should return 400 on invalid JSON
- Should return 400 on missing secret
- Should return 500 when ADMIN_SECRET not set

**POST /api/auth/logout** (2 tests)
- Should clear session cookie (200)
- Should always return success

**GET /api/auth/me** (4 tests)
- Should return isAdmin true when authenticated (200)
- Should return isAdmin false when not authenticated (200)
- Should check admin-session cookie
- Should handle missing cookie

**Cookie Security** (3 tests)
- Should set secure flag in production
- Should set httpOnly flag
- Should set sameSite strict

---

### 6. `src/__tests__/integration/api/check.test.ts` (6 tests)

**GET /api/check** (6 tests)
- Should check for missing artists (200)
- Should check for missing release (200)
- Should return empty arrays when all exist
- Should require query parameters (400)
- Should handle multiple artist IDs
- Should handle comma-separated IDs

---

### 7. `src/__tests__/integration/api/covers.test.ts` (4 tests)

**DELETE /api/covers** (4 tests)
- Should delete cover file (200)
- Should require filename parameter (400)
- Should handle non-existent files gracefully (404)
- Should return proper error messages

---

## Mock Setup Template

All integration tests should use this pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import * as serverLib from '@/lib/server'
import { mockLibraryData, createMockRelease } from '../../mocks/data'

vi.mock('@/lib/server')
vi.mock('fs/promises') // If testing file operations

describe('API Route Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Setup default mocks
  beforeEach(() => {
    vi.mocked(serverLib.getReleases).mockResolvedValue(mockLibraryData.releases)
    vi.mocked(serverLib.updateReleases).mockResolvedValue(undefined)
  })

  it('test description', async () => {
    // Arrange
    const request = new NextRequest('http://localhost/api/route')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

---

## FormData Testing Pattern

For POST/PUT endpoints that use FormData:

```typescript
const formData = new FormData()
formData.append('field', 'value')
formData.append('jsonField', JSON.stringify({ key: 'value' }))

const request = new NextRequest('http://localhost/api/route', {
  method: 'POST',
  body: formData,
})

const response = await POST(request)
```

---

## File Upload Testing Pattern

```typescript
const coverFile = new File(['fake image'], 'cover.jpg', { type: 'image/jpeg' })
formData.append('coverImage', coverFile)
```

---

## Query Parameter Testing Pattern

```typescript
const request = new NextRequest('http://localhost/api/route?param=value')
const { searchParams } = new URL(request.url)
const param = searchParams.get('param')
```

---

## Coverage Goals

- **Overall:** 85%+ coverage for all API routes
- **Critical paths:** 90%+ coverage (releases, artists, library-data)
- **Auth routes:** 85%+ coverage
- **Utility routes:** 80%+ coverage (health, check, covers)

---

## Implementation Order (Recommended)

1. **releases.test.ts** - Most complex, sets pattern for others
2. **artists.test.ts** - Similar to releases
3. **library-data.test.ts** - Simpler, good for confidence building
4. **auth.test.ts** - Important for security
5. **health.test.ts** - Complex logic, needs careful mocking
6. **check.test.ts** - Simple validation endpoint
7. **covers.test.ts** - Simple file deletion endpoint

---

## Known Challenges

1. **File System Mocking:** Need to mock `fs/promises` carefully to avoid actual file writes
2. **FormData:** Next.js FormData handling requires proper content-type headers
3. **Unicode Normalization:** Test with actual unicode characters (café, ñ, etc.)
4. **Cookie Testing:** Mock cookie parsing for auth tests
5. **Middleware:** Health endpoint requires admin auth via middleware

---

## Success Criteria

- ✅ All 82 tests implemented
- ✅ All tests passing
- ✅ 85%+ coverage for all API routes
- ✅ No actual file system operations in tests
- ✅ Proper error handling coverage
- ✅ Edge cases covered (empty arrays, invalid JSON, missing fields)

---

## Estimated Timeline

- **Day 1:** releases.test.ts (21 tests) - 4 hours
- **Day 2:** artists.test.ts (16 tests) - 3 hours
- **Day 3:** library-data.test.ts + auth.test.ts (23 tests) - 4 hours
- **Day 4:** health.test.ts + check.test.ts + covers.test.ts (22 tests) - 3 hours
- **Day 5:** Debug, fix, coverage analysis - 2 hours

**Total:** ~16 hours

---

## Next Steps

1. Review this plan with the team
2. Set up integration test folder structure
3. Start with releases.test.ts as the template
4. Use the pattern from releases for other route tests
5. Run coverage after each file is complete
6. Address any gaps in coverage
7. Update MASTER_PLAN.md when complete
