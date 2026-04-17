import { test, expect } from '@playwright/test';

test('language switcher persists preference', async ({ page }) => {
  await page.goto('/');

  // Switch to Thai
  await page.locator('button, [data-testid=lang-switch]', { hasText: /^TH$/ }).click();

  // Spot-check Thai strings in nav/buttons (adjust selectors to your app)
  await expect(page.locator('nav').first()).not.toContainText('About Us');

  // Switch back to English
  await page.locator('button, [data-testid=lang-switch]', { hasText: /^EN$/ }).click();
  await expect(page.locator('nav').first()).toContainText('About Us');

  // Verify localStorage persistence
  const lang = await page.evaluate(() => localStorage.getItem('i18nextLng'));
  expect(lang).toBe('en');

  // Reload and confirm preference held
  await page.reload();
  await expect(page.locator('nav').first()).toContainText('About Us');
});