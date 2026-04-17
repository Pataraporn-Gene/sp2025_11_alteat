import { test, expect } from '@playwright/test';

test('sign up → login → profile', async ({ page }) => {
  const user = {
    username: 'testuser_' + Date.now(),
    email:    `test${Date.now()}@example.com`,
    password: 'Password123'
  };

  // Sign up
  await page.goto('/signup');
  await page.fill('[name=username]', user.username);
  await page.fill('[name=email]',    user.email);
  await page.fill('[name=password]', user.password);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/signupsuccess');

  // Log in
  await page.goto('/login');
  await page.fill('[name=email]',    user.email);
  await page.fill('[name=password]', user.password);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/profile');

  // Verify profile data
  await expect(page.getByText(user.username)).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
});

test('delete account flow', async ({ page }) => {
  const username = 'delete-test_' + Date.now();
  const email = `${username}@example.com`;
  const password = 'Password123';

  // Sign up
  await page.goto('/signup');
  await page.fill('[name=username]', username);
  await page.fill('[name=email]', email);
  await page.fill('[name=password]', password);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/signupsuccess');

  // Go to profile
  await page.goto('/profile');

  // Wait for profile context to be loaded (username becomes visible, exact match to avoid matching email substring)
  await expect(page.getByText(username, { exact: true })).toBeVisible();

  // Trigger delete
  await page.locator('button', { hasText: /delete account/i }).click();

  // Confirmation modal
  const modal = page.locator('[role=dialog], .modal');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText(/delete|remove/i);

  // Confirm
  await modal.locator('button', { hasText: /confirm|yes|delete/i }).click();

  // Success modal
  await expect(
    page.locator('[role=dialog], .modal')
  ).toContainText(/deleted|success/i);

  // Click close button on success modal and wait for the window reload 
  await Promise.all([
    page.waitForNavigation(),
    page.locator('[role=dialog], .modal').locator('button').click()
  ]);

  // Signed out and redirected
  await expect(page).toHaveURL('/');
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeNull();
});

test('login redirect preserves chatbot destination', async ({ page }) => {
  await page.goto('/');

  // Make sure we're logged out
  await page.evaluate(() => localStorage.clear());

  // Navigate to chatbot without auth
  await page.goto('/chatbot');
  await expect(page).toHaveURL('/login?redirect=/chatbot');

  // Log in
  await page.fill('[name=email]',    'user@example.com');
  await page.fill('[name=password]', 'Password123');
  await page.click('button[type=submit]');

  // Verify redirect back to chatbot
  await expect(page).toHaveURL('/chatbot');
});

test('login redirect preserves chatbot message via shortcut', async ({ page }) => {
  await page.goto('/');

  // Make sure we're logged out
  await page.evaluate(() => localStorage.clear());

  // Wait for clear local storage to settle
  await page.waitForTimeout(100);

  // Navigate to chatbot with a pre-filled message (like from homepage shortcut)
  await page.goto('/chatbot?message=Hello');
  
  // It should kick us out to login page
  await expect(page).toHaveURL('/login?redirect=/chatbot&message=Hello');

  // Fill in login credentials
  await page.fill('[name=email]',    'user@example.com');
  await page.fill('[name=password]', 'Password123');
  await page.click('button[type=submit]');

  // We expect to land in the chatbot again! 
  await expect(page).toHaveURL(/chatbot/);
  
  // Check if our message was actually sent and added to the chat window
  await expect(page.getByText('Hello').first()).toBeVisible();
});