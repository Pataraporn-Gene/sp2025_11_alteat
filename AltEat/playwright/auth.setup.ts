import { test as setup } from '@playwright/test';

setup('save auth state', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'Password123');
  await page.click('button[type=submit]');
  await page.waitForURL('/profile');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});