import { test, expect } from '@playwright/test'

test.describe('Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse')
  })

  test('should display all releases on load', async ({ page }) => {
    // Wait for library data to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Count tiles - there should be at least one
    const tileCount = await page.locator('[data-testid="music-tile"]').count()
    expect(tileCount).toBeGreaterThan(0)
  })

  test('should filter releases by search query', async ({ page }) => {
    // Wait for tiles to load first
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    const searchInput = page.locator('input[type="search"]')

    // Type search query - use a common word from test data
    await searchInput.fill('Computer')

    // Wait for filter to apply
    await page.waitForTimeout(300)

    // Check that at least one result contains the search term
    const tiles = page.locator('[data-testid="music-tile"]')
    const tileCount = await tiles.count()

    if (tileCount > 0) {
      const firstTile = tiles.first()
      const text = await firstTile.textContent()
      expect(text?.toLowerCase()).toContain('computer')
    }
  })

  test('should clear search when X button clicked', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')

    // Type something
    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')

    // Click clear button (X icon button)
    await page.locator('button').filter({ has: page.locator('svg') }).first().click()

    // Verify search is cleared
    await expect(searchInput).toHaveValue('')
  })

  test('should clear search when Escape pressed', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')

    // Type something
    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')

    // Press Escape
    await searchInput.press('Escape')

    // Verify search is cleared
    await expect(searchInput).toHaveValue('')
  })

  test('should filter by artist when clicking artist tag', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Find first tile and click on an artist link
    const firstTile = page.locator('[data-testid="music-tile"]').first()
    const artistLink = firstTile.locator('a[href*="/browse?artist="]').first()

    await artistLink.click()

    // Should navigate to filtered view
    await expect(page).toHaveURL(/\/browse\?artist=/)

    // Should show artist filter tag with "Artist:" label
    await expect(page.locator('text=/Artist:/i')).toBeVisible()
  })

  test('should clear artist filter when clicking X on tag', async ({ page }) => {
    // Navigate directly to artist filter
    await page.goto('/browse?artist=[Artist1]')

    // Wait for page to load
    await page.waitForTimeout(500)

    // Find and click the X button on the artist tag
    const clearLink = page.locator('[href="/browse"]').first()
    await clearLink.click()

    // Should navigate back to unfiltered browse
    await expect(page).toHaveURL('/browse')

    // Artist tag should not be visible
    await expect(page.locator('text=/Artist:/i')).not.toBeVisible()
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    // Find and click home button/link
    await page.locator('[href="/"]').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/')
  })

  test('should load images for first 8 tiles with priority', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Get all tiles
    const tiles = page.locator('[data-testid="music-tile"]')
    const tileCount = await tiles.count()

    // Check first 8 tiles (or all tiles if less than 8)
    const tilesToCheck = Math.min(8, tileCount)

    // Count images with high priority
    const priorityImages = await page.locator('img[fetchpriority="high"]').count()

    // Should have priority images for first tiles
    expect(priorityImages).toBeGreaterThan(0)
    expect(priorityImages).toBeLessThanOrEqual(tilesToCheck)
  })
})
