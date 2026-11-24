import { test, expect } from '@playwright/test'

test.describe('Smoke Test', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    // Check that the page title contains "Krater"
    await expect(page.locator('h1')).toContainText('Krater')
  })

  test('should display version number', async ({ page }) => {
    await page.goto('/')

    // Check for version number in footer
    await expect(page.locator('text=/v\\d+\\.\\d+/i')).toBeVisible()
  })
})
