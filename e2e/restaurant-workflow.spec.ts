import { test, expect } from '@playwright/test';

test.describe('Hotel Dashboard E2E Workflow', () => {
  test('1. Hotel owner can load dashboard and view analytics', async ({ page }) => {
    await page.goto('http://localhost:3001/analytics');
    await expect(page.getByText(/Restaurant Analytics & Yield/i)).toBeVisible();
    await expect(page.getByText(/Today's Sales/i)).toBeVisible();
  });

  test('2. Hotel owner can view menu items', async ({ page }) => {
    await page.goto('http://localhost:3001/menu');
    await expect(page.getByText(/Menu Management/i)).toBeVisible();
  });
});
