import { expect, test } from '@playwright/test';

test('projects index renders the Projects heading', async ({ page }) => {
  await page.goto('/projects');

  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
});
