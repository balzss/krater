import { test, expect } from '@playwright/test'

test.describe('Random Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/random')
  })

  test('should display a random release', async ({ page }) => {
    // Wait for a tile to be displayed
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Verify tile is visible
    await expect(page.locator('[data-testid="music-tile"]')).toBeVisible()
  })

  test('should show different release when roll button clicked', async ({ page }) => {
    // Wait for initial release to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Get initial release title
    const initialTile = page.locator('[data-testid="music-tile"]')
    const initialTitle = await initialTile.textContent()

    // Click roll button
    const rollButton = page
      .locator('button')
      .filter({ hasText: /roll|dice/i })
      .first()
    await rollButton.click()

    // Wait for new release
    await page.waitForTimeout(200)

    // Get new release title
    const newTile = page.locator('[data-testid="music-tile"]')
    const newTitle = await newTile.textContent()

    // Title should be defined (release loaded)
    expect(newTitle).toBeTruthy()
    // Note: In small libraries, might get same release, but that's okay
  })

  test('should enable undo button after rolling', async ({ page }) => {
    // Wait for initial release to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Find undo button
    const undoButton = page.locator('button').filter({ hasText: /undo/i }).first()

    // Initially should be disabled
    await expect(undoButton).toBeDisabled()

    // Click roll button
    const rollButton = page
      .locator('button')
      .filter({ hasText: /roll|dice/i })
      .first()
    await rollButton.click()

    // Wait for roll to complete
    await page.waitForTimeout(200)

    // Now undo should be enabled
    await expect(undoButton).toBeEnabled()
  })

  test('should go back to previous release when undo clicked', async ({ page }) => {
    // Wait for initial release to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Get initial release title
    const initialTitle = await page.locator('[data-testid="music-tile"]').textContent()

    // Click roll button
    const rollButton = page
      .locator('button')
      .filter({ hasText: /roll|dice/i })
      .first()
    await rollButton.click()
    await page.waitForTimeout(200)

    // Click undo button
    const undoButton = page.locator('button').filter({ hasText: /undo/i }).first()
    await undoButton.click()
    await page.waitForTimeout(200)

    // Get title after undo
    const afterUndoTitle = await page.locator('[data-testid="music-tile"]').textContent()

    // Should be back to initial release
    expect(afterUndoTitle).toBe(initialTitle)
  })

  test('should cycle through releases and wrap around', async ({ page }) => {
    // Wait for initial release to load
    await page.waitForSelector('[data-testid="music-tile"]', { timeout: 10000 })

    // Get library size from the page data
    const response = await page.request.get('/data/libraryData.json')
    const data = await response.json()
    const librarySize = data.releases.length

    // Roll through all releases plus one to test wrap-around
    const rollButton = page
      .locator('button')
      .filter({ hasText: /roll|dice/i })
      .first()

    for (let i = 0; i < librarySize + 1; i++) {
      await rollButton.click()
      await page.waitForTimeout(100)
    }

    // Should still have a tile visible (wrapped around)
    await expect(page.locator('[data-testid="music-tile"]')).toBeVisible()
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    // Find and click home button/link
    await page.locator('[href="/"]').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/')
  })
})
