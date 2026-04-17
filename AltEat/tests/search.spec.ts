import { test, expect } from '@playwright/test';

test('ingredient search filters and detail popup', async ({ page }) => {
  await page.goto('/ingredientsearch');

  // Apply filters
  await page.getByText('Sour', { exact: true }).first().click();
  await page.getByText('Orange', { exact: true }).first().click();

  // Results appear
  const cards = page.locator('div.bg-white.rounded-2xl.overflow-hidden, [data-testid=ingredient-card]');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });
  expect(await cards.count()).toBeGreaterThan(0);

  // Open detail popup
  await cards.first().locator('button', { hasText: /more detail/i }).click();

  const popup = page.locator('[data-testid=ingredient-detail-popup]');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[data-testid=name]')).not.toBeEmpty();
  await expect(popup.locator('[data-testid=tag]').first()).toBeVisible();
});

test('recipe search with Thai input and filters', async ({ page }) => {
  await page.goto('/recipesearch');

  // Thai search query
  const searchInput = page.locator('input[type=search], input[placeholder*=search i]');
  await searchInput.fill('ไก่');
  await page.keyboard.press('Enter');

  // Results should appear (translation happens server-side)
  const results = page.locator('[data-testid=recipe-card]');
  await expect(results.first()).toBeVisible({ timeout: 8000 });

  // Cuisine filter
  const cuisineFilter = page.getByText('Japanese', { exact: true }).first();
  await cuisineFilter.scrollIntoViewIfNeeded();
  await cuisineFilter.click({ force: true });
  
  // Wait for the empty state since there are no Japanese recipes matching 'ไก่'
  await expect(results.first()).not.toBeVisible({ timeout: 15000 });

  // Pagination should not be visible when there are no results
  const viewMore = page.getByRole('button', { name: /view more/i });
  await expect(viewMore).not.toBeVisible();
});