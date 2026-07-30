import { test, expect } from '@playwright/test';

test.describe('Delivery Partner E2E Workflow', () => {
  test('1. Delivery partner can view performance analytics', async ({ page }) => {
    await page.goto('http://localhost:3002/analytics');
    await expect(page.getByText(/Performance & Earnings Analytics/i)).toBeVisible();
    await expect(page.getByText(/Today Earnings/i)).toBeVisible();
  });

  test('2. Delivery partner can check earnings page', async ({ page }) => {
    await page.goto('http://localhost:3002/earnings');
    await expect(page.getByText(/Weekly Earnings Breakdown/i)).toBeVisible();
  });
});
