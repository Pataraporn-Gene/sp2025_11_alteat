import { test, expect } from '@playwright/test';

test('chatbot conversation flow', async ({ page }) => {
  await page.goto('/chatbot');

  const input = page.locator('textarea, input[type=text]').last();
  const send  = page.locator('button[aria-label*=send i], button[type=submit]').last();

  // Message 1 – expect text reply
  await input.fill('What can I substitute for eggs in baking?');
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/webhook/') && r.status() === 200),
    send.click()
  ]);
  await expect(page.getByText(/substitute|replace|alternative/i).last()).toBeVisible();

  // Message 2 – expect RecipeCarousel
  await input.fill('I have strawberry, flour, egg — what can I make?');
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/webhook/') && r.status() === 200),
    send.click()
  ]);
  await expect(
    page.locator('.recipe-carousel, [data-testid=recipe-carousel]')
  ).toBeVisible({ timeout: 10000 });

  // History sidebar is open by default on desktop. 
  // Let's just assert that our newly created session item sprouted in the history!
  await expect(
    page.locator('.history-item, [data-testid=history-item]').first()
  ).toBeVisible();

  // New chat clears messages
  await page.locator('button', { hasText: /new chat/i }).click();
  await expect(
    page.locator('.message, [data-testid=message]')
  ).toHaveCount(0);
});