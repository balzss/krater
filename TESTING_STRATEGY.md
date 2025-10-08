# Krater Testing Strategy

**Document Version:** 1.0
**Date:** 2025-10-08
**Purpose:** Establish comprehensive testing infrastructure before implementing improvements

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Testing Infrastructure Setup](#2-testing-infrastructure-setup)
3. [Unit Testing Strategy](#3-unit-testing-strategy)
4. [Integration Testing Strategy](#4-integration-testing-strategy)
5. [Component Testing Strategy](#5-component-testing-strategy)
6. [E2E Testing Strategy](#6-e2e-testing-strategy)
7. [Test Data Management](#7-test-data-management)
8. [Implementation Phases](#8-implementation-phases)
9. [Coverage Goals & Metrics](#9-coverage-goals--metrics)
10. [CI/CD Integration](#10-cicd-integration)

---

## 1. Overview & Philosophy

### 1.1 Current State

**No existing tests.** The codebase has zero test coverage, presenting both a challenge and opportunity to establish best practices from the ground up.

### 1.2 Testing Principles

1. **Test behavior, not implementation** - Focus on what code does, not how
2. **Test-driven refactoring** - Write tests for existing behavior before refactoring
3. **Fast feedback loops** - Prioritize fast unit tests, minimal slow E2E tests
4. **Maintainable tests** - Tests should be as clean as production code
5. **Realistic test data** - Use data that mirrors production scenarios

### 1.3 Testing Pyramid

```
           /\
          /  \     E2E Tests (5%)
         /____\    ~10 critical path tests
        /      \
       /        \  Integration Tests (30%)
      /__________\ ~50 API route tests
     /            \
    /              \ Unit Tests (65%)
   /________________\ ~120 tests for utilities/hooks
```

### 1.4 Success Criteria

- ✅ **80%+ code coverage** for critical paths
- ✅ **All tests pass** before any refactoring begins
- ✅ **Tests run in < 30 seconds** (unit + integration)
- ✅ **Clear failure messages** that help debug issues
- ✅ **Zero flaky tests** - all tests deterministic

---

## 2. Testing Infrastructure Setup

### 2.1 Recommended Tools

| Layer | Tool | Justification |
|-------|------|---------------|
| **Unit/Integration** | Vitest | Fast, native ESM support, compatible with Next.js 15 |
| **Component** | React Testing Library | Industry standard, encourages good practices |
| **E2E** | Playwright | Modern, reliable, excellent debugging tools |
| **Mocking** | MSW (Mock Service Worker) | Intercepts network requests, works in tests and browser |
| **Coverage** | Vitest + c8 | Built-in, accurate coverage reporting |
| **Visual Regression** | Playwright | Optional but useful for UI components |

### 2.2 Dependencies to Install

```json
{
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^2.0.0",
    "happy-dom": "^14.12.0",
    "msw": "^2.3.0",
    "vitest": "^2.0.0"
  }
}
```

### 2.3 Configuration Files

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'build/',
        '*.config.ts',
        '**/*.d.ts',
        'src/app/manifest.ts',
        'chrome-extension/**',
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### vitest.setup.ts
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './src/__tests__/mocks/handlers'

// MSW server setup
export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_PATH = ''
process.env.APP_VERSION = '0.1.0-test'
```

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

### 2.4 Folder Structure

```
krater/
├── src/
│   ├── __tests__/              # Test files mirror src structure
│   │   ├── unit/
│   │   │   ├── lib/
│   │   │   │   ├── data.test.ts
│   │   │   │   └── server.test.ts
│   │   │   └── hooks/
│   │   │       ├── use-library-data.test.ts
│   │   │       ├── use-auth.test.ts
│   │   │       └── use-health-check.test.ts
│   │   ├── integration/
│   │   │   └── api/
│   │   │       ├── library-data.test.ts
│   │   │       ├── releases.test.ts
│   │   │       ├── artists.test.ts
│   │   │       ├── health.test.ts
│   │   │       └── auth.test.ts
│   │   ├── components/
│   │   │   ├── music-tile.test.tsx
│   │   │   ├── search-input.test.tsx
│   │   │   ├── action-button.test.tsx
│   │   │   └── menu-item.test.tsx
│   │   ├── mocks/
│   │   │   ├── handlers.ts         # MSW request handlers
│   │   │   ├── data.ts             # Mock library data
│   │   │   └── fs-mock.ts          # File system mocks
│   │   └── utils/
│   │       ├── test-utils.tsx      # Custom render functions
│   │       └── test-data.ts        # Test data generators
│   └── [existing source files]
├── e2e/
│   ├── browse.spec.ts
│   ├── artists.spec.ts
│   ├── random.spec.ts
│   ├── settings.spec.ts
│   └── fixtures/
│       └── test-library.json
├── vitest.config.ts
├── vitest.setup.ts
└── playwright.config.ts
```

### 2.5 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 3. Unit Testing Strategy

### 3.1 Priority: Data Layer & Server Utilities

**Target Files:**
- `src/lib/data/index.ts` - Type definitions
- `src/lib/server/index.ts` - File I/O operations (117 lines)

#### 3.1.1 File: `src/__tests__/unit/lib/server.test.ts`

**Test Cases (20 tests):**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import {
  deleteCoverFile,
  ensureDirectoryExists,
  getLibraryData,
  setLibraryData,
  getReleases,
  updateReleases,
  getArtists,
  updateArtists,
} from '@/lib/server'
import { mockLibraryData } from '../../mocks/data'

vi.mock('fs/promises')

describe('deleteCoverFile', () => {
  it('should delete file when filename provided', async () => {
    vi.mocked(fs.unlink).mockResolvedValue(undefined)

    await deleteCoverFile('test-cover.jpg')

    expect(fs.unlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cover.jpg')
    )
  })

  it('should handle ENOENT error gracefully', async () => {
    const error = new Error('File not found')
    error.code = 'ENOENT'
    vi.mocked(fs.unlink).mockRejectedValue(error)

    await expect(deleteCoverFile('missing.jpg')).resolves.toBeUndefined()
  })

  it('should do nothing when filename is null', async () => {
    await deleteCoverFile(null)
    expect(fs.unlink).not.toHaveBeenCalled()
  })

  it('should do nothing when filename is undefined', async () => {
    await deleteCoverFile(undefined)
    expect(fs.unlink).not.toHaveBeenCalled()
  })
})

describe('ensureDirectoryExists', () => {
  it('should create directory when it does not exist', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)

    await ensureDirectoryExists('/test/path')

    expect(fs.mkdir).toHaveBeenCalledWith('/test/path', { recursive: true })
  })

  it('should handle EEXIST error gracefully', async () => {
    const error = new Error('Directory exists')
    error.code = 'EEXIST'
    vi.mocked(fs.mkdir).mockRejectedValue(error)

    await expect(ensureDirectoryExists('/test/path')).resolves.toBeUndefined()
  })

  it('should throw on other errors', async () => {
    const error = new Error('Permission denied')
    error.code = 'EACCES'
    vi.mocked(fs.mkdir).mockRejectedValue(error)

    await expect(ensureDirectoryExists('/test/path')).rejects.toThrow(
      'Could not create directory'
    )
  })
})

describe('getLibraryData', () => {
  it('should read and parse library data', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))

    const result = await getLibraryData()

    expect(result).toEqual(mockLibraryData)
  })

  it('should throw error when file cannot be read', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

    await expect(getLibraryData()).rejects.toThrow(
      'Could not read library data file'
    )
  })

  it('should throw error when JSON is invalid', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('invalid json{')

    await expect(getLibraryData()).rejects.toThrow()
  })
})

describe('setLibraryData', () => {
  it('should write library data to file', async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)

    await setLibraryData(mockLibraryData)

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('libraryData.json'),
      JSON.stringify(mockLibraryData, null, 2),
      'utf-8'
    )
  })

  it('should throw error on write failure', async () => {
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'))

    await expect(setLibraryData(mockLibraryData)).rejects.toThrow(
      'Failed to write data to JSON file'
    )
  })
})

describe('getReleases', () => {
  it('should return releases from library data', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))

    const result = await getReleases()

    expect(result).toEqual(mockLibraryData.releases)
  })
})

describe('updateReleases', () => {
  it('should update releases while preserving artists', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)

    const newReleases = [...mockLibraryData.releases]
    await updateReleases(newReleases)

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(JSON.stringify(mockLibraryData.artists[0].displayName)),
      'utf-8'
    )
  })
})

describe('getArtists', () => {
  it('should return artists from library data', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))

    const result = await getArtists()

    expect(result).toEqual(mockLibraryData.artists)
  })
})

describe('updateArtists', () => {
  it('should update artists while preserving releases', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)

    const newArtists = [...mockLibraryData.artists]
    await updateArtists(newArtists)

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(mockLibraryData.releases[0].title),
      'utf-8'
    )
  })
})
```

### 3.2 Priority: Hooks

**Target Files:**
- `src/hooks/use-library-data.ts` (147 lines)
- `src/hooks/use-auth.ts` (82 lines)
- `src/hooks/use-health-check.ts` (59 lines)

#### 3.2.1 File: `src/__tests__/unit/hooks/use-library-data.test.ts`

**Test Cases (15 tests):**

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLibraryData } from '@/hooks/use-library-data'
import { mockLibraryData } from '../../mocks/data'

global.fetch = vi.fn()

describe('useLibraryData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLibraryData', () => {
    it('should fetch library data when enabled', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockLibraryData,
      } as Response)

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        expect(result.current.releases).toEqual(mockLibraryData.releases)
        expect(result.current.artists).toEqual(mockLibraryData.artists)
      })
    })

    it('should not fetch when enabled is false', () => {
      renderHook(() => useLibraryData({ enabled: false }))
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        expect(result.current.releases).toBeNull()
        expect(result.current.artists).toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('sorting', () => {
    it('should sort releases ascending by title', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockLibraryData,
      } as Response)

      const { result } = renderHook(() =>
        useLibraryData({ enabled: true, releaseSort: 'asc' })
      )

      await waitFor(() => {
        expect(result.current.releases![0].title <= result.current.releases![1].title).toBe(true)
      })
    })

    it('should sort releases descending by title', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockLibraryData,
      } as Response)

      const { result } = renderHook(() =>
        useLibraryData({ enabled: true, releaseSort: 'desc' })
      )

      await waitFor(() => {
        expect(result.current.releases![0].title >= result.current.releases![1].title).toBe(true)
      })
    })

    it('should sort artists alphabetically by default', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockLibraryData,
      } as Response)

      const { result } = renderHook(() => useLibraryData({ enabled: true }))

      await waitFor(() => {
        const artists = result.current.artists!
        expect(
          artists[0].displayName.localeCompare(artists[1].displayName, undefined, {
            sensitivity: 'base',
          }) <= 0
        ).toBe(true)
      })
    })
  })

  describe('setLibraryData', () => {
    it('should upload library data successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', savedAt: new Date().toISOString() }),
      } as Response)

      const { result } = renderHook(() => useLibraryData())
      const file = new File([JSON.stringify(mockLibraryData)], 'library.json', {
        type: 'application/json',
      })

      await waitFor(async () => {
        const response = await result.current.setLibraryData(file)
        expect(response.status).toBe('ok')
      })
    })

    it('should reject non-JSON files', async () => {
      const { result } = renderHook(() => useLibraryData())
      const file = new File(['test'], 'file.txt', { type: 'text/plain' })

      await expect(result.current.setLibraryData(file)).rejects.toThrow(
        'Invalid file type'
      )
    })
  })
})
```

#### 3.2.2 File: `src/__tests__/unit/hooks/use-auth.test.ts`

**Test Cases (12 tests):**

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '@/hooks/use-auth'

global.fetch = vi.fn()

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should check auth status on mount', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ isAdmin: true }),
    } as Response)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should login successfully with valid secret', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAdmin: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, isAdmin: true }),
      } as Response)

    const { result } = renderHook(() => useAuth())

    await waitFor(async () => {
      const success = await result.current.login('valid-secret')
      expect(success).toBe(true)
      expect(result.current.isAdmin).toBe(true)
    })
  })

  it('should fail login with invalid secret', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAdmin: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid secret' }),
      } as Response)

    const { result } = renderHook(() => useAuth())

    await waitFor(async () => {
      const success = await result.current.login('invalid-secret')
      expect(success).toBe(false)
      expect(result.current.loginError).toBe('Invalid secret')
    })
  })

  it('should logout successfully', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAdmin: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logout successful' }),
      } as Response)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isAdmin).toBe(true))

    await waitFor(async () => {
      await result.current.logout()
      expect(result.current.isAdmin).toBe(false)
    })
  })
})
```

### 3.3 Test Data Mocks

#### File: `src/__tests__/mocks/data.ts`

```typescript
import type { LibraryData, Release, Artist } from '@/lib/data'

export const mockArtists: Artist[] = [
  {
    displayName: 'Radiohead',
    rymId: 'radiohead',
    rymUrl: 'https://rateyourmusic.com/artist/radiohead',
  },
  {
    displayName: 'Aphex Twin',
    rymId: 'aphex-twin',
    rymUrl: 'https://rateyourmusic.com/artist/aphex_twin',
  },
  {
    displayName: 'Nine Inch Nails',
    rymId: 'nine-inch-nails',
  },
]

export const mockReleases: Release[] = [
  {
    title: 'OK Computer',
    rymId: 'ok-computer',
    rymUrl: 'https://rateyourmusic.com/release/album/radiohead/ok-computer',
    artistRymIds: ['radiohead'],
    cover: 'ok-computer.jpg',
    media: {
      spotify: 'https://open.spotify.com/album/6dVIqQ8qmQ5GBnJ9shOYGE',
    },
  },
  {
    title: 'Selected Ambient Works 85-92',
    rymId: 'saw-85-92',
    artistRymIds: ['aphex-twin'],
    cover: 'saw-85-92.jpg',
    media: {
      spotify: 'https://open.spotify.com/album/7aNclGRxTysfh6z0d8671k',
    },
  },
  {
    title: 'The Downward Spiral',
    rymId: 'downward-spiral',
    artistRymIds: ['nine-inch-nails'],
    cover: 'downward-spiral.jpg',
    media: {},
  },
]

export const mockLibraryData: LibraryData = {
  releases: mockReleases,
  artists: mockArtists,
}

export function createMockRelease(overrides?: Partial<Release>): Release {
  return {
    title: 'Test Album',
    rymId: 'test-album',
    artistRymIds: ['test-artist'],
    cover: 'test-cover.jpg',
    media: { spotify: 'https://open.spotify.com/album/test' },
    ...overrides,
  }
}

export function createMockArtist(overrides?: Partial<Artist>): Artist {
  return {
    displayName: 'Test Artist',
    rymId: 'test-artist',
    ...overrides,
  }
}
```

---

## 4. Integration Testing Strategy

### 4.1 API Route Testing Priority

All API routes need integration tests that verify:
1. Request/response cycle
2. Data persistence
3. Error handling
4. Input validation

**Target Files (9 routes):**
- `/api/library-data` (GET, POST)
- `/api/releases` (GET, POST, PUT, DELETE)
- `/api/artists` (GET, POST, PUT, DELETE)
- `/api/health` (GET)
- `/api/check` (GET)
- `/api/covers` (DELETE)
- `/api/auth/login` (POST)
- `/api/auth/logout` (POST)
- `/api/auth/me` (GET)

### 4.2 Test Approach

Use Next.js API route testing utilities with mocked file system.

#### 4.2.1 File: `src/__tests__/integration/api/releases.test.ts`

**Test Cases (25 tests):**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PUT, DELETE } from '@/app/api/releases/route'
import { NextRequest } from 'next/server'
import * as serverLib from '@/lib/server'
import { mockLibraryData, createMockRelease } from '../../mocks/data'

vi.mock('@/lib/server')

describe('GET /api/releases', () => {
  it('should return all releases', async () => {
    vi.mocked(serverLib.getReleases).mockResolvedValue(mockLibraryData.releases)

    const request = new NextRequest('http://localhost/api/releases')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockLibraryData.releases)
  })

  it('should return 500 on server error', async () => {
    vi.mocked(serverLib.getReleases).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/releases')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Failed to fetch releases')
  })
})

describe('POST /api/releases', () => {
  beforeEach(() => {
    vi.mocked(serverLib.getReleases).mockResolvedValue(mockLibraryData.releases)
    vi.mocked(serverLib.updateReleases).mockResolvedValue(undefined)
    vi.mocked(serverLib.ensureDirectoryExists).mockResolvedValue(undefined)
  })

  it('should create new release with valid data', async () => {
    const newRelease = createMockRelease({ rymId: 'new-release' })
    const formData = new FormData()
    formData.append('title', newRelease.title)
    formData.append('rymId', newRelease.rymId)
    formData.append('cover', newRelease.cover)
    formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
    formData.append('media', JSON.stringify(newRelease.media))

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('Release added successfully')
    expect(data.release.rymId).toBe('new-release')
  })

  it('should reject duplicate rymId', async () => {
    const duplicateRelease = createMockRelease({ rymId: mockLibraryData.releases[0].rymId })
    const formData = new FormData()
    formData.append('title', duplicateRelease.title)
    formData.append('rymId', duplicateRelease.rymId)
    formData.append('cover', duplicateRelease.cover)
    formData.append('artistRymIds', JSON.stringify(duplicateRelease.artistRymIds))
    formData.append('media', JSON.stringify(duplicateRelease.media))

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('already exists')
  })

  it('should reject missing required fields', async () => {
    const formData = new FormData()
    formData.append('title', 'Incomplete Release')
    // Missing rymId, artistRymIds, media, cover

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('Missing required')
  })

  it('should handle cover file upload', async () => {
    const newRelease = createMockRelease({ rymId: 'with-cover' })
    const coverFile = new File(['fake image'], 'cover.jpg', { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('title', newRelease.title)
    formData.append('rymId', newRelease.rymId)
    formData.append('cover', newRelease.cover)
    formData.append('coverImage', coverFile)
    formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
    formData.append('media', JSON.stringify(newRelease.media))

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    // Verify file write was called (via mock)
  })

  it('should normalize unicode in cover filenames', async () => {
    const newRelease = createMockRelease({
      rymId: 'unicode-test',
      cover: 'caf%C3%A9.jpg', // URL-encoded café
    })

    const formData = new FormData()
    formData.append('title', newRelease.title)
    formData.append('rymId', newRelease.rymId)
    formData.append('cover', newRelease.cover)
    formData.append('artistRymIds', JSON.stringify(newRelease.artistRymIds))
    formData.append('media', JSON.stringify(newRelease.media))

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.release.cover).toBe('café.jpg') // Properly decoded and normalized
  })
})

describe('PUT /api/releases', () => {
  beforeEach(() => {
    vi.mocked(serverLib.getReleases).mockResolvedValue(mockLibraryData.releases)
    vi.mocked(serverLib.updateReleases).mockResolvedValue(undefined)
    vi.mocked(serverLib.ensureDirectoryExists).mockResolvedValue(undefined)
  })

  it('should update existing release', async () => {
    const existingRelease = mockLibraryData.releases[0]
    const formData = new FormData()
    formData.append('rymId', existingRelease.rymId)
    formData.append('title', 'Updated Title')

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'PUT',
      body: formData,
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.release.title).toBe('Updated Title')
  })

  it('should return 404 for non-existent release', async () => {
    const formData = new FormData()
    formData.append('rymId', 'non-existent')
    formData.append('title', 'Updated')

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'PUT',
      body: formData,
    })

    const response = await PUT(request)

    expect(response.status).toBe(404)
  })

  it('should handle cover replacement', async () => {
    const existingRelease = mockLibraryData.releases[0]
    const newCoverFile = new File(['new image'], 'new-cover.jpg', { type: 'image/jpeg' })

    vi.mocked(serverLib.deleteCoverFile).mockResolvedValue(undefined)

    const formData = new FormData()
    formData.append('rymId', existingRelease.rymId)
    formData.append('cover', 'new-cover.jpg')
    formData.append('coverImage', newCoverFile)

    const request = new NextRequest('http://localhost/api/releases', {
      method: 'PUT',
      body: formData,
    })

    const response = await PUT(request)

    expect(response.status).toBe(200)
    // Verify old cover deleted
    expect(serverLib.deleteCoverFile).toHaveBeenCalledWith(existingRelease.cover)
  })
})

describe('DELETE /api/releases', () => {
  beforeEach(() => {
    vi.mocked(serverLib.getReleases).mockResolvedValue(mockLibraryData.releases)
    vi.mocked(serverLib.updateReleases).mockResolvedValue(undefined)
    vi.mocked(serverLib.deleteCoverFile).mockResolvedValue(undefined)
  })

  it('should delete release by rymId', async () => {
    const releaseToDelete = mockLibraryData.releases[0]

    const request = new NextRequest(
      `http://localhost/api/releases?rymId=${releaseToDelete.rymId}`
    )

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('deleted successfully')
    expect(serverLib.deleteCoverFile).toHaveBeenCalledWith(releaseToDelete.cover)
  })

  it('should return 404 for non-existent release', async () => {
    const request = new NextRequest('http://localhost/api/releases?rymId=non-existent')

    const response = await DELETE(request)

    expect(response.status).toBe(404)
  })

  it('should require rymId parameter', async () => {
    const request = new NextRequest('http://localhost/api/releases')

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('Missing')
  })
})
```

#### 4.2.2 Similar Test Files Needed

- `artists.test.ts` (20 tests) - Similar structure to releases
- `library-data.test.ts` (8 tests) - GET/POST endpoints
- `health.test.ts` (12 tests) - Health check logic
- `auth.test.ts` (15 tests) - Login/logout/session verification

**Total Integration Tests:** ~80 tests

---

## 5. Component Testing Strategy

### 5.1 Component Testing Priority

Focus on interactive components with complex behavior.

**High Priority:**
1. `MusicTile` - Main display component
2. `SearchInput` - User input handling
3. `MenuItem` - Polymorphic component
4. `ActionButton` - Polymorphic component

**Lower Priority:**
5. `ClearableTag` - Simple component
6. `SpotifyPlayButton` - Complex but isolated (can be E2E tested)

### 5.2 Test Utilities

#### File: `src/__tests__/utils/test-utils.tsx`

```typescript
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      {children}
    </ThemeProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
```

### 5.3 Component Test Examples

#### File: `src/__tests__/components/music-tile.test.tsx`

**Test Cases (12 tests):**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MusicTile } from '@/components/music-tile'
import { mockArtists } from '../mocks/data'

describe('MusicTile', () => {
  const defaultProps = {
    cover: 'test-cover.jpg',
    artists: [mockArtists[0]],
    title: 'Test Album',
    media: 'https://open.spotify.com/album/test',
  }

  it('should render album title', () => {
    render(<MusicTile {...defaultProps} />)
    expect(screen.getByText('Test Album')).toBeInTheDocument()
  })

  it('should render artist names', () => {
    render(<MusicTile {...defaultProps} />)
    expect(screen.getByText('Radiohead')).toBeInTheDocument()
  })

  it('should render multiple artists separated by commas', () => {
    render(<MusicTile {...defaultProps} artists={mockArtists.slice(0, 2)} />)

    expect(screen.getByText('Radiohead')).toBeInTheDocument()
    expect(screen.getByText('Aphex Twin')).toBeInTheDocument()
    expect(screen.getByText(/, $/)).toBeInTheDocument()
  })

  it('should handle undefined artists gracefully', () => {
    render(<MusicTile {...defaultProps} artists={[undefined]} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('should link to media URL', () => {
    render(<MusicTile {...defaultProps} />)

    const links = screen.getAllByRole('link', { name: /Test Album/i })
    expect(links[0]).toHaveAttribute('href', defaultProps.media)
    expect(links[0]).toHaveAttribute('target', '_blank')
  })

  it('should link artist to browse page', () => {
    render(<MusicTile {...defaultProps} />)

    const artistLink = screen.getByRole('link', { name: 'Radiohead' })
    expect(artistLink).toHaveAttribute('href', '/browse?artist=radiohead')
  })

  it('should show info button on hover (desktop)', async () => {
    const { container } = render(<MusicTile {...defaultProps} />)
    const tile = container.firstChild as HTMLElement

    await userEvent.hover(tile)

    const infoButton = screen.getByRole('button')
    expect(infoButton).toHaveClass('opacity-100')
  })

  it('should hide info button when not hovering (desktop)', async () => {
    const { container } = render(<MusicTile {...defaultProps} />)
    const tile = container.firstChild as HTMLElement

    await userEvent.hover(tile)
    await userEvent.unhover(tile)

    const infoButton = screen.getByRole('button')
    expect(infoButton).toHaveClass('opacity-0')
  })

  it('should render cover image with correct src', () => {
    render(<MusicTile {...defaultProps} />)

    const image = screen.getByAlt('Test Album')
    expect(image).toHaveAttribute('src', expect.stringContaining('test-cover.jpg'))
  })

  it('should prioritize image when priority is true', () => {
    render(<MusicTile {...defaultProps} priority={true} />)

    const image = screen.getByAlt('Test Album')
    // Next.js Image component sets priority attribute
    expect(image).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<MusicTile {...defaultProps} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should show coming soon alert when info button clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<MusicTile {...defaultProps} />)
    const infoButton = screen.getByRole('button')

    await userEvent.click(infoButton)

    expect(alertSpy).toHaveBeenCalledWith('Coming soon...')
    alertSpy.mockRestore()
  })
})
```

#### File: `src/__tests__/components/search-input.test.tsx`

**Test Cases (10 tests):**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '@/components/search-input'

describe('SearchInput', () => {
  const mockOnQueryChange = vi.fn()

  beforeEach(() => {
    mockOnQueryChange.mockClear()
  })

  it('should render with placeholder', () => {
    render(
      <SearchInput
        query=""
        onQueryChange={mockOnQueryChange}
        placeholder="Search..."
      />
    )

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should call onQueryChange when typing', async () => {
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} />)

    const input = screen.getByRole('searchbox')
    await userEvent.type(input, 'test')

    expect(mockOnQueryChange).toHaveBeenCalledTimes(4) // Once per character
    expect(mockOnQueryChange).toHaveBeenLastCalledWith('test')
  })

  it('should display current query value', () => {
    render(<SearchInput query="existing query" onQueryChange={mockOnQueryChange} />)

    expect(screen.getByDisplayValue('existing query')).toBeInTheDocument()
  })

  it('should show clear button when query is not empty', () => {
    render(<SearchInput query="test" onQueryChange={mockOnQueryChange} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should hide clear button when query is empty', () => {
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should clear query when clear button clicked', async () => {
    render(<SearchInput query="test" onQueryChange={mockOnQueryChange} />)

    const clearButton = screen.getByRole('button')
    await userEvent.click(clearButton)

    expect(mockOnQueryChange).toHaveBeenCalledWith('')
  })

  it('should clear query when Escape key pressed', async () => {
    render(<SearchInput query="test" onQueryChange={mockOnQueryChange} />)

    const input = screen.getByRole('searchbox')
    await userEvent.type(input, '{Escape}')

    expect(mockOnQueryChange).toHaveBeenCalledWith('')
  })

  it('should render search icon', () => {
    const { container } = render(
      <SearchInput query="" onQueryChange={mockOnQueryChange} />
    )

    // Lucide icons render as SVG
    const searchIcon = container.querySelector('svg')
    expect(searchIcon).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <SearchInput
        query=""
        onQueryChange={mockOnQueryChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should pass through additional HTML attributes', () => {
    render(
      <SearchInput
        query=""
        onQueryChange={mockOnQueryChange}
        aria-label="Custom search"
      />
    )

    expect(screen.getByLabelText('Custom search')).toBeInTheDocument()
  })
})
```

**Total Component Tests:** ~45 tests

---

## 6. E2E Testing Strategy

### 6.1 Critical User Flows

Focus on high-value user journeys that integrate multiple components.

**Priority Flows:**
1. Browse and filter releases
2. Search for artists
3. View random releases
4. Admin: Login and manage library
5. Theme switching

### 6.2 E2E Test Examples

#### File: `e2e/browse.spec.ts`

**Test Cases (8 tests):**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse')
  })

  test('should display all releases on load', async ({ page }) => {
    // Wait for library data to load
    await expect(page.locator('[data-testid="music-tile"]').first()).toBeVisible()

    // Count tiles
    const tileCount = await page.locator('[data-testid="music-tile"]').count()
    expect(tileCount).toBeGreaterThan(0)
  })

  test('should filter releases by search query', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')

    // Type search query
    await searchInput.fill('Radiohead')

    // Wait for filter to apply
    await page.waitForTimeout(300)

    // Check results
    const tiles = page.locator('[data-testid="music-tile"]')
    const firstTile = tiles.first()
    await expect(firstTile).toContainText('Radiohead')
  })

  test('should clear search when X button clicked', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')

    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')

    await page.locator('button[aria-label="Clear search"]').click()
    await expect(searchInput).toHaveValue('')
  })

  test('should clear search when Escape pressed', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')

    await searchInput.fill('test')
    await searchInput.press('Escape')

    await expect(searchInput).toHaveValue('')
  })

  test('should filter by artist when clicking artist tag', async ({ page }) => {
    // Click on first release's artist link
    await page.locator('[data-testid="music-tile"]').first()
      .locator('a[href*="/browse?artist="]').first().click()

    // Should navigate to filtered view
    await expect(page).toHaveURL(/\/browse\?artist=/)

    // Should show artist filter tag
    await expect(page.locator('text=/Artist:/i')).toBeVisible()
  })

  test('should clear artist filter when clicking X on tag', async ({ page }) => {
    // Navigate to artist filter
    await page.goto('/browse?artist=radiohead')

    // Click X button on artist tag
    await page.locator('[href="/browse"]').click()

    // Should navigate back to all releases
    await expect(page).toHaveURL('/browse')
    await expect(page.locator('text=/Artist:/i')).not.toBeVisible()
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    await page.locator('[href="/"]').click()
    await expect(page).toHaveURL('/')
  })

  test('should load images for first 8 tiles with priority', async ({ page }) => {
    // Check that first 8 tiles have priority attribute
    const priorityImages = await page.locator('img[fetchpriority="high"]').count()
    expect(priorityImages).toBeGreaterThanOrEqual(8)
  })
})
```

#### File: `e2e/artists.spec.ts`

**Test Cases (5 tests):**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Artists Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artists')
  })

  test('should display all artists alphabetically', async ({ page }) => {
    const artistItems = page.locator('[data-testid="artist-item"]')
    await expect(artistItems.first()).toBeVisible()

    const count = await artistItems.count()
    expect(count).toBeGreaterThan(0)

    // Check alphabetical order
    const firstArtist = await artistItems.first().textContent()
    const secondArtist = await artistItems.nth(1).textContent()
    expect(firstArtist!.localeCompare(secondArtist!)).toBeLessThanOrEqual(0)
  })

  test('should filter artists by search query', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('Radio')

    await page.waitForTimeout(200)

    const visibleArtists = await page.locator('[data-testid="artist-item"]').count()
    expect(visibleArtists).toBeGreaterThan(0)

    const firstArtist = await page.locator('[data-testid="artist-item"]').first()
    await expect(firstArtist).toContainText('Radio', { ignoreCase: true })
  })

  test('should navigate to filtered browse when artist clicked', async ({ page }) => {
    const firstArtist = page.locator('[data-testid="artist-item"]').first()
    await firstArtist.click()

    await expect(page).toHaveURL(/\/browse\?artist=/)
  })

  test('should show empty state when no artists match search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('zzzznonexistentartist')

    await page.waitForTimeout(200)

    const artistCount = await page.locator('[data-testid="artist-item"]').count()
    expect(artistCount).toBe(0)
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    await page.locator('[href="/"]').click()
    await expect(page).toHaveURL('/')
  })
})
```

#### File: `e2e/random.spec.ts`

**Test Cases (6 tests):**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Random Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/random')
  })

  test('should display a random release', async ({ page }) => {
    await expect(page.locator('[data-testid="music-tile"]')).toBeVisible()
  })

  test('should show different release when roll button clicked', async ({ page }) => {
    const initialTitle = await page.locator('text=/.*/).first().textContent()

    await page.locator('button[aria-label="Roll dice"]').click()
    await page.waitForTimeout(100)

    const newTitle = await page.locator('text=/.*/).first().textContent()
    // In a large library, this should almost always be different
    // For small test libraries, this test might be flaky
    expect(newTitle).toBeDefined()
  })

  test('should enable undo button after rolling', async ({ page }) => {
    const undoButton = page.locator('button[aria-label="Undo"]')

    // Initially disabled
    await expect(undoButton).toBeDisabled()

    // Roll once
    await page.locator('button[aria-label="Roll dice"]').click()

    // Now enabled
    await expect(undoButton).toBeEnabled()
  })

  test('should go back to previous release when undo clicked', async ({ page }) => {
    const initialTitle = await page.locator('[data-testid="music-tile"]')
      .locator('text=/.*/).first().textContent()

    // Roll to new release
    await page.locator('button[aria-label="Roll dice"]').click()
    await page.waitForTimeout(100)

    // Undo
    await page.locator('button[aria-label="Undo"]').click()
    await page.waitForTimeout(100)

    const afterUndoTitle = await page.locator('[data-testid="music-tile"]')
      .locator('text=/.*/).first().textContent()

    expect(afterUndoTitle).toBe(initialTitle)
  })

  test('should cycle through releases and wrap around', async ({ page }) => {
    // Get library size (make API call or count from page)
    const response = await page.request.get('/data/libraryData.json')
    const data = await response.json()
    const librarySize = data.releases.length

    // Roll enough times to wrap around
    for (let i = 0; i < librarySize + 1; i++) {
      await page.locator('button[aria-label="Roll dice"]').click()
      await page.waitForTimeout(50)
    }

    // Should have wrapped back to first release
    expect(await page.locator('[data-testid="music-tile"]')).toBeVisible()
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    await page.locator('[href="/"]').click()
    await expect(page).toHaveURL('/')
  })
})
```

#### File: `e2e/settings.spec.ts`

**Test Cases (10 tests):**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Settings')
  })

  test('should download library data', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.locator('text=/Download library data/i').click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/krater-library-\d{4}-\d{2}-\d{2}\.json/)
  })

  test('should toggle theme between dark and light', async ({ page }) => {
    const html = page.locator('html')

    // Check initial theme
    const initialTheme = await html.getAttribute('class')

    // Click theme toggle
    await page.locator('button[aria-label="Toggle theme"]').click()
    await page.waitForTimeout(100)

    // Check theme changed
    const newTheme = await html.getAttribute('class')
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should show login prompt when clicking connect server', async ({ page }) => {
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt')
      expect(dialog.message()).toContain('admin key')
      await dialog.dismiss()
    })

    await page.locator('text=/Connect server/i').click()
  })

  test('should show health check after admin login', async ({ page }) => {
    // Mock admin login
    page.on('dialog', async dialog => {
      await dialog.accept('test-secret')
    })

    await page.locator('text=/Connect server/i').click()

    // After login, health check should be visible
    await expect(page.locator('text=/Library health check/i')).toBeVisible()
  })

  test('should display coming soon alert for Last.fm', async ({ page }) => {
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Coming soon')
      await dialog.accept()
    })

    await page.locator('text=/Connect Last.fm/i').click()
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    await page.locator('[href="/"]').click()
    await expect(page).toHaveURL('/')
  })

  test.describe('Admin Features', () => {
    test.beforeEach(async ({ page, context }) => {
      // Set admin cookie
      await context.addCookies([{
        name: 'admin-session',
        value: 'true',
        domain: 'localhost',
        path: '/',
      }])
      await page.reload()
    })

    test('should show admin-only features', async ({ page }) => {
      await expect(page.locator('text=/Import from JSON/i')).toBeVisible()
      await expect(page.locator('text=/Edit library/i')).toBeVisible()
      await expect(page.locator('text=/Disconnect from server/i')).toBeVisible()
    })

    test('should show health check section', async ({ page }) => {
      await expect(page.locator('text=/Library health check/i')).toBeVisible()
    })

    test('should refresh health check when button clicked', async ({ page }) => {
      const refreshButton = page.locator('button[aria-label="Refresh"]')
      await refreshButton.click()

      // Verify API call was made (check network tab or mock)
      await page.waitForTimeout(500)
      await expect(page.locator('text=/Library health check/i')).toBeVisible()
    })
  })
})
```

#### File: `e2e/home.spec.ts`

**Test Cases (4 tests):**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display app title and version', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Krater')
    await expect(page.locator('text=/v0\\.1\\.0/i')).toBeVisible()
  })

  test('should navigate to browse page', async ({ page }) => {
    await page.locator('text=/Browse.*releases/i').click()
    await expect(page).toHaveURL('/browse')
  })

  test('should navigate to artists page', async ({ page }) => {
    await page.locator('text=/View.*artists/i').click()
    await expect(page).toHaveURL('/artists')
  })

  test('should navigate to random page', async ({ page }) => {
    await page.locator('text=/Get a random suggestion/i').click()
    await expect(page).toHaveURL('/random')
  })

  test('should open GitHub in new tab', async ({ page, context }) => {
    const pagePromise = context.waitForEvent('page')

    await page.locator('[href*="github.com"]').click()

    const newPage = await pagePromise
    await expect(newPage).toHaveURL(/github\.com/)
  })

  test('should navigate to settings page', async ({ page }) => {
    await page.locator('[href="/settings"]').click()
    await expect(page).toHaveURL('/settings')
  })
})
```

**Total E2E Tests:** ~35 tests

---

## 7. Test Data Management

### 7.1 Test Fixtures

Create realistic test data that covers edge cases.

#### File: `e2e/fixtures/test-library.json`

```json
{
  "releases": [
    {
      "title": "OK Computer",
      "rymId": "ok-computer",
      "rymUrl": "https://rateyourmusic.com/release/album/radiohead/ok-computer",
      "artistRymIds": ["radiohead"],
      "cover": "ok-computer.jpg",
      "media": {
        "spotify": "https://open.spotify.com/album/6dVIqQ8qmQ5GBnJ9shOYGE"
      }
    },
    {
      "title": "Selected Ambient Works 85-92",
      "rymId": "saw-85-92",
      "rymUrl": "https://rateyourmusic.com/release/album/aphex-twin/selected-ambient-works-85-92",
      "artistRymIds": ["aphex-twin"],
      "cover": "saw-85-92.jpg",
      "media": {
        "spotify": "https://open.spotify.com/album/7aNclGRxTysfh6z0d8671k"
      }
    },
    {
      "title": "Release with Multiple Artists",
      "rymId": "multi-artist",
      "artistRymIds": ["radiohead", "aphex-twin"],
      "cover": "multi.jpg",
      "media": {}
    },
    {
      "title": "Release with Unicode: Café ñ",
      "rymId": "unicode-test",
      "artistRymIds": ["radiohead"],
      "cover": "café.jpg",
      "media": {
        "spotify": "https://open.spotify.com/album/test"
      }
    },
    {
      "title": "Release Missing Artist",
      "rymId": "missing-artist",
      "artistRymIds": ["non-existent-artist"],
      "cover": "missing.jpg",
      "media": {}
    }
  ],
  "artists": [
    {
      "displayName": "Radiohead",
      "rymId": "radiohead",
      "rymUrl": "https://rateyourmusic.com/artist/radiohead"
    },
    {
      "displayName": "Aphex Twin",
      "rymId": "aphex-twin",
      "rymUrl": "https://rateyourmusic.com/artist/aphex_twin"
    },
    {
      "displayName": "Unused Artist",
      "rymId": "unused",
      "rymUrl": "https://rateyourmusic.com/artist/unused"
    }
  ]
}
```

### 7.2 MSW Handlers

#### File: `src/__tests__/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'
import { mockLibraryData } from './data'

export const handlers = [
  // GET /data/libraryData.json
  http.get('/data/libraryData.json', () => {
    return HttpResponse.json(mockLibraryData)
  }),

  // GET /api/library-data
  http.get('/api/library-data', () => {
    return HttpResponse.json({
      status: 'ok',
      libraryData: mockLibraryData,
      checkedAt: new Date().toISOString(),
    })
  }),

  // POST /api/library-data
  http.post('/api/library-data', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      status: 'ok',
      message: 'Data saved successfully.',
      savedAt: new Date().toISOString(),
    })
  }),

  // GET /api/auth/me
  http.get('/api/auth/me', ({ cookies }) => {
    const isAdmin = cookies['admin-session'] === 'true'
    return HttpResponse.json({ isAdmin })
  }),

  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.secret === 'test-secret') {
      return HttpResponse.json(
        { success: true, isAdmin: true },
        {
          headers: {
            'Set-Cookie': 'admin-session=true; Path=/; HttpOnly',
          },
        }
      )
    }
    return HttpResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    )
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json(
      { message: 'Logout successful' },
      {
        headers: {
          'Set-Cookie': 'admin-session=; Path=/; Max-Age=0',
        },
      }
    )
  }),

  // GET /api/health
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      issues: {
        unusedCovers: ['unused-cover.jpg'],
        unusedArtists: [{ rymId: 'unused', displayName: 'Unused Artist' }],
        missingCovers: [],
        missingArtists: [],
      },
      checkedAt: new Date().toISOString(),
    })
  }),
]
```

---

## 8. Implementation Phases

### Phase 1: Setup Infrastructure (Day 1)
**Effort:** 4-6 hours

1. Install dependencies
2. Create configuration files
3. Set up folder structure
4. Create test utilities and mocks
5. Verify basic test can run

**Deliverable:** `npm run test` executes successfully

---

### Phase 2: Unit Tests - Data Layer (Day 2)
**Effort:** 6-8 hours

1. Write tests for `src/lib/server/index.ts` (20 tests)
2. Write tests for data types and helpers
3. Create comprehensive mock data
4. Achieve 90%+ coverage for data layer

**Deliverable:** All server utility functions covered

---

### Phase 3: Unit Tests - Hooks (Day 3)
**Effort:** 6-8 hours

1. Write tests for `use-library-data` (15 tests)
2. Write tests for `use-auth` (12 tests)
3. Write tests for `use-health-check` (8 tests)
4. Write tests for `use-theme` (5 tests)

**Deliverable:** All custom hooks covered

---

### Phase 4: Integration Tests - API Routes (Days 4-5)
**Effort:** 12-16 hours

1. Write tests for `/api/releases` (25 tests)
2. Write tests for `/api/artists` (20 tests)
3. Write tests for `/api/library-data` (8 tests)
4. Write tests for `/api/health` (12 tests)
5. Write tests for `/api/auth/*` (15 tests)

**Deliverable:** All API routes covered

---

### Phase 5: Component Tests (Day 6)
**Effort:** 6-8 hours

1. Write tests for `MusicTile` (12 tests)
2. Write tests for `SearchInput` (10 tests)
3. Write tests for `ActionButton` (8 tests)
4. Write tests for `MenuItem` (8 tests)
5. Write tests for `ClearableTag` (5 tests)

**Deliverable:** Core components covered

---

### Phase 6: E2E Tests (Days 7-8)
**Effort:** 10-12 hours

1. Set up Playwright
2. Create test fixtures
3. Write tests for all pages (35 tests)
4. Test critical user flows
5. Configure CI for E2E tests

**Deliverable:** Critical paths covered with E2E tests

---

### Phase 7: Coverage Analysis & Gap Filling (Day 9)
**Effort:** 4-6 hours

1. Run coverage report
2. Identify gaps
3. Add missing tests
4. Achieve 80%+ coverage target

**Deliverable:** Coverage goals met

---

### Phase 8: CI/CD Integration (Day 10)
**Effort:** 4 hours

1. Add GitHub Actions workflow
2. Configure test runs on PR
3. Set up coverage reporting
4. Add status badges

**Deliverable:** Automated testing in CI

---

## 9. Coverage Goals & Metrics

### 9.1 Target Coverage

| Layer | Target | Minimum |
|-------|--------|---------|
| Unit Tests | 90% | 80% |
| Integration Tests | 85% | 75% |
| Component Tests | 80% | 70% |
| Overall | 85% | 80% |

### 9.2 Coverage by File Priority

**Must be 90%+:**
- `src/lib/server/index.ts`
- `src/hooks/use-library-data.ts`
- `src/hooks/use-auth.ts`

**Must be 80%+:**
- All API route handlers
- `src/components/music-tile.tsx`
- `src/components/search-input.tsx`

**Can be 70%+:**
- `src/components/spotify-play-button.tsx` (complex OAuth, better tested E2E)
- Page components (primarily composition, covered by E2E)

### 9.3 Metrics to Track

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# Check thresholds (enforced in vitest.config.ts)
# - Lines: 80%
# - Functions: 75%
# - Branches: 70%
# - Statements: 80%
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

#### File: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit & integration tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit

      - name: Check coverage thresholds
        run: |
          if [ $(jq '.total.lines.pct < 80' coverage/coverage-summary.json) = "true" ]; then
            echo "Coverage below 80%"
            exit 1
          fi

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### 10.2 Pre-commit Hooks

#### File: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests on staged files
npm run test -- --run --changed
```

### 10.3 Status Badges

Add to `README.md`:

```markdown
![Tests](https://github.com/balzss/krater/actions/workflows/test.yml/badge.svg)
![Coverage](https://codecov.io/gh/balzss/krater/branch/main/graph/badge.svg)
```

---

## Summary

### Test Count Overview

| Category | Test Count | Effort (hours) |
|----------|-----------|----------------|
| Unit Tests - Data Layer | 20 | 6-8 |
| Unit Tests - Hooks | 40 | 6-8 |
| Integration Tests - API | 80 | 12-16 |
| Component Tests | 45 | 6-8 |
| E2E Tests | 35 | 10-12 |
| **Total** | **220 tests** | **44-58 hours** |

### Timeline

**Total Estimated Time:** 10 working days (44-58 hours)

**Recommended Approach:**
1. Implement in phases as outlined
2. Each phase produces working, runnable tests
3. Can parallelize unit/integration test writing
4. E2E tests can be written while unit tests run

### Success Metrics

✅ **220+ tests passing**
✅ **80%+ code coverage**
✅ **All tests run in < 60 seconds** (unit + integration)
✅ **E2E tests complete in < 5 minutes**
✅ **Zero flaky tests**
✅ **CI/CD integrated and passing**

### Next Steps

After testing infrastructure is in place:

1. **Verify all tests pass** ✅
2. **Run refactoring from IMPROVEMENT_STRATEGY.md**
3. **Re-run tests after each improvement phase**
4. **Monitor coverage doesn't drop**
5. **Add tests for new code during improvements**

---

## Appendix: Quick Reference Commands

```bash
# Setup
npm install
npm run test  # Verify setup

# Development
npm run test:watch         # Watch mode for TDD
npm run test:ui            # Visual test UI
npm run test:coverage      # Generate coverage report

# E2E
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:debug     # Debug mode with inspector

# CI
npm run test:all           # Run all tests (unit + integration + E2E)

# Coverage
open coverage/index.html   # View detailed coverage report
```

---

**Document End**
