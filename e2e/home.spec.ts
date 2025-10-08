import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display app title and version', async ({ page }) => {
    // Check for title
    await expect(page.locator('h1')).toContainText('Krater')

    // Check for version number (should be visible somewhere on the page)
    await expect(page.locator('text=/v\\d+\\.\\d+/i')).toBeVisible()
  })

  test('should navigate to browse page', async ({ page }) => {
    // Click on the browse link/button
    await page.locator('text=/Browse/i').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/browse')
  })

  test('should navigate to artists page', async ({ page }) => {
    // Click on the artists link/button
    await page.locator('text=/Artists/i').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/artists')
  })

  test('should navigate to random page', async ({ page }) => {
    // Click on the random link/button
    await page.locator('text=/Random/i').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/random')
  })

  test('should open GitHub in new tab', async ({ page, context }) => {
    // Listen for new page (tab) to open
    const pagePromise = context.waitForEvent('page')

    // Click on GitHub link
    await page.locator('a[href*="github.com"]').click()

    // Get the new page
    const newPage = await pagePromise
    await newPage.waitForLoadState()

    // Verify it's a GitHub URL
    expect(newPage.url()).toContain('github.com')
  })

  test('should navigate to settings page', async ({ page }) => {
    // Click on settings link/button
    await page.locator('[href="/settings"]').click()

    // Verify navigation
    await expect(page).toHaveURL('/settings')
  })
})
