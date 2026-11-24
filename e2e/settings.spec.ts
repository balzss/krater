import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('should toggle theme between dark and light', async ({ page }) => {
    const html = page.locator('html')
    const initialIsDark = await html.evaluate((el) => el.classList.contains('dark'))

    await page.locator('button[aria-label="Toggle theme"]').click()

    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains('dark')))
      .toBe(!initialIsDark)
  })

  test('should keep the chosen theme after a reload', async ({ page }) => {
    const html = page.locator('html')
    const initialIsDark = await html.evaluate((el) => el.classList.contains('dark'))

    await page.locator('button[aria-label="Toggle theme"]').click()
    await page.reload()

    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains('dark')))
      .toBe(!initialIsDark)
  })

  test('should switch between standard and compact layout', async ({ page }) => {
    await page.getByRole('button', { name: /switch to compact view/i }).click()

    await expect(page.getByRole('button', { name: /switch to standard view/i })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('krater-layout'))).toBe('compact')
  })

  test('should remember the preferred media player', async ({ page }) => {
    await page.getByRole('button', { name: 'Bandcamp' }).click()

    expect(await page.evaluate(() => localStorage.getItem('krater-preferred-media-player'))).toBe(
      'bandcamp'
    )
  })
})
