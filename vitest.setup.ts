import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './src/__tests__/mocks/handlers'

// Newer Node versions define their own `localStorage` global. It evaluates to undefined unless Node
// is started with --localstorage-file, and it hides the one happy-dom provides.
function ensureStorage(name: 'localStorage' | 'sessionStorage') {
  if (globalThis[name] !== undefined) return

  const items = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key)
    },
    setItem: (key, value) => {
      items.set(key, String(value))
    },
  }
  Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true })
}
ensureStorage('localStorage')
ensureStorage('sessionStorage')

// MSW server setup
export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
