import { test, expect } from '@playwright/test'

test.describe('Artists Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artists')
  })

  test('should display all artists alphabetically', async ({ page }) => {
    // Wait for artists to load
    await page.waitForSelector('[data-testid="artist-item"]', { timeout: 10000 })

    const artistItems = page.locator('[data-testid="artist-item"]')
    const count = await artistItems.count()
    expect(count).toBeGreaterThan(0)

    // Check alphabetical order by comparing first two artists
    if (count >= 2) {
      const firstArtistText = await artistItems.first().textContent()
      const secondArtistText = await artistItems.nth(1).textContent()

      // Basic alphabetical check (locale-aware)
      const comparison = firstArtistText!.localeCompare(secondArtistText!, undefined, {
        sensitivity: 'base',
      })
      expect(comparison).toBeLessThanOrEqual(0)
    }
  })

  test('should filter artists by search query', async ({ page }) => {
    // Wait for artists to load
    await page.waitForSelector('[data-testid="artist-item"]', { timeout: 10000 })

    const searchInput = page.locator('input[type="search"]')

    // Type search query
    await searchInput.fill('Radio')

    // Wait for filter to apply
    await page.waitForTimeout(300)

    // Check filtered results
    const visibleArtists = await page.locator('[data-testid="artist-item"]').count()

    if (visibleArtists > 0) {
      const firstArtist = page.locator('[data-testid="artist-item"]').first()
      const artistText = await firstArtist.textContent()
      expect(artistText?.toLowerCase()).toContain('radio')
    }
  })

  test('should navigate to filtered browse when artist clicked', async ({ page }) => {
    // Wait for artists to load
    await page.waitForSelector('[data-testid="artist-item"]', { timeout: 10000 })

    // Click on first artist
    const firstArtist = page.locator('[data-testid="artist-item"]').first()
    await firstArtist.click()

    // Should navigate to browse page with artist filter
    await expect(page).toHaveURL(/\/browse\?artist=/)
  })

  test('should show empty state when no artists match search', async ({ page }) => {
    // Wait for artists to load
    await page.waitForSelector('[data-testid="artist-item"]', { timeout: 10000 })

    const searchInput = page.locator('input[type="search"]')

    // Type non-existent search query
    await searchInput.fill('zzzznonexistentartistname123456')

    // Wait for filter to apply
    await page.waitForTimeout(300)

    // Should have no artists displayed
    const artistCount = await page.locator('[data-testid="artist-item"]').count()
    expect(artistCount).toBe(0)
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    // Find and click home button/link
    await page.locator('[href="/"]').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/')
  })
})
