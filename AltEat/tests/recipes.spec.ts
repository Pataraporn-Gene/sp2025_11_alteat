import { test, expect } from '@playwright/test';

// Assumes storageState with a logged-in user is configured
test('favourite and unfavourite a recipe', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/recipesearch');
  await page.fill('[placeholder*="search" i]', 'Pancake');
  await page.keyboard.press('Enter');

  // Wait for results and click first heart
  const firstCard = page.locator('.recipe-card').first();
  await firstCard.waitFor();
  const heartBtn = firstCard.locator('[aria-label*="favorite" i], .heart-icon').first();
  
  // Guard against leaked test state! If previous test crashed after favoriting,
  // the icon will already be red. We must unfavorite it first to test the add flow.
  const isAlreadyFav = await heartBtn.locator('svg').evaluate((el) => el.classList.contains('fill-red-500'));
  if (isAlreadyFav) {
    await heartBtn.click({ force: true });
    await expect(heartBtn.locator('svg')).not.toHaveClass(/fill-red-500/i, { timeout: 10000 });
  }

  await heartBtn.click({ force: true });
  // Wait for the backend request to complete. React will recolor the heart only after success!
  await expect(heartBtn.locator('svg')).toHaveClass(/fill-red-500/i, { timeout: 10000 });

  // Verify on favorites page
  await page.goto('/favorite');
  await expect(
    page.getByRole('heading', { name: /pancake/i })
  ).toBeVisible();

  // Unfavourite
  const favPageHeart = page.locator('[aria-label*="favorite" i], .heart-icon').first();
  await favPageHeart.click({ force: true });
  // Wait for the UI to update to un-favorited state
  await expect(
    page.getByRole('heading', { name: /pancake/i })
  ).not.toBeVisible({ timeout: 15000 });
});

test('recipe detail page renders correctly', async ({ page }) => {
  await page.goto('/recipe/1');

  // Core metadata
  await expect(page.locator('h1')).not.toBeEmpty();
  await expect(page.locator('img[alt]').first()).toBeVisible();

  // Tags and timing
  await expect(page.locator('.recipe-tag, [data-testid=tag]').first())
    .toBeVisible();
  await expect(page.getByText(/min/i).first()).toBeVisible();

  // Ingredients list
  const ingredients = page.locator('ul.ingredients li, [data-testid=ingredient]');
  await expect(ingredients.first()).toBeVisible();
  expect(await ingredients.count()).toBeGreaterThan(0);

  // Numbered steps
  const steps = page.locator('ol.steps li, [data-testid=step]');
  await expect(steps.first()).toBeVisible();
  expect(await steps.count()).toBeGreaterThan(0);

  // Sidebar (desktop only)
  const viewport = page.viewportSize();
  if (viewport && viewport.width >= 1024) {
    await expect(
      page.locator('.recommended-sidebar, [data-testid=recommended]')
    ).toBeVisible();
  }
});