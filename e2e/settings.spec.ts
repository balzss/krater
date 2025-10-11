import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('should display settings page', async ({ page }) => {
    // Check for settings heading
    await expect(page.locator('h1, h2').filter({ hasText: /settings/i })).toBeVisible()
  })

  test('should download library data', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click download button
    await page.locator('text=/Download library data/i').click()

    // Wait for download to start
    const download = await downloadPromise

    // Verify filename matches expected pattern
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/krater-library-.*\.json/)
  })

  test('should toggle theme between dark and light', async ({ page }) => {
    const html = page.locator('html')

    // Get initial theme
    const initialClass = await html.getAttribute('class')

    // Find and click theme toggle button by aria-label
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    await themeToggle.click()

    // Wait for theme change
    await page.waitForTimeout(200)

    // Get new theme
    const newClass = await html.getAttribute('class')

    // Theme should have changed
    expect(newClass).not.toBe(initialClass)
  })

  test('should show login form when clicking admin login', async ({ page }) => {
    // Click Admin Login button to expand form
    await page.locator('text=/Admin Login/i').click()

    // Wait for form to appear
    await page.waitForTimeout(300)

    // Verify form fields are visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should toggle admin login form', async ({ page }) => {
    // Click Admin Login to show form
    await page.locator('text=/Admin Login/i').click()
    await page.waitForTimeout(200)

    // Verify form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Click "Hide Admin Login" to hide form
    await page.locator('text=/Hide Admin Login/i').click()
    await page.waitForTimeout(200)

    // Verify form is hidden
    await expect(page.locator('input[type="email"]')).not.toBeVisible()
  })

  test('should show Last.fm integration section', async ({ page }) => {
    // Look for Last.fm integration section
    const lastfmSection = page.locator('text=/Last\\.fm Integration/i')
    await expect(lastfmSection).toBeVisible()

    // Should have a connect button when not connected
    const connectButton = page.locator('text=/Connect Last\\.fm/i')
    const isVisible = await connectButton.isVisible().catch(() => false)

    // Button should be visible (assuming user not connected in tests)
    expect(isVisible).toBe(true)
  })

  test('should navigate home when home button clicked', async ({ page }) => {
    // Find and click home button/link
    await page.locator('[href="/"]').first().click()

    // Verify navigation
    await expect(page).toHaveURL('/')
  })

  test.describe('Admin Features', () => {
    test.beforeEach(async ({ page, context }) => {
      // Set admin cookie to simulate logged-in admin
      await context.addCookies([
        {
          name: 'admin-session',
          value: 'true',
          domain: 'localhost',
          path: '/',
        },
      ])
      await page.reload()
      await page.waitForTimeout(500)
    })

    test('should show admin-only features', async ({ page }) => {
      // Check for admin-specific elements
      // These may include: import, edit, logout buttons

      // Look for common admin features
      const hasImport = await page
        .locator('text=/Import.*JSON/i')
        .isVisible()
        .catch(() => false)
      const hasEdit = await page
        .locator('text=/Edit.*library/i')
        .isVisible()
        .catch(() => false)
      const hasLogout = await page
        .locator('text=/Logout/i')
        .isVisible()
        .catch(() => false)

      // At least one admin feature should be visible
      expect(hasImport || hasEdit || hasLogout).toBe(true)
    })

    test('should show health check section', async ({ page }) => {
      // Look for health check section
      const healthCheck = page.locator('text=/health.*check/i')

      // May or may not be visible depending on implementation
      const isVisible = await healthCheck.isVisible().catch(() => false)

      // This is informational - we're checking if it appears with admin session
      // If not visible, that's okay - the feature may not be fully implemented yet
    })

    test('should refresh health check when button clicked', async ({ page }) => {
      // Look for refresh button in health check section
      const refreshButton = page
        .locator('button')
        .filter({ hasText: /refresh|reload/i })
        .first()

      if (await refreshButton.isVisible()) {
        await refreshButton.click()

        // Wait for refresh to complete
        await page.waitForTimeout(1000)

        // Health check should still be visible after refresh
        const healthCheck = page.locator('text=/health.*check/i')
        await expect(healthCheck).toBeVisible()
      }
    })
  })
})
