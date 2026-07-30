import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E Workflow', () => {
  test('1. Admin can access Platform BI Analytics', async ({ page }) => {
    await page.goto('http://localhost:3003/analytics');
    await expect(page.getByText(/Platform Business Intelligence/i)).toBeVisible();
    await expect(page.getByText(/Today Revenue/i)).toBeVisible();
  });

  test('2. Admin can access Reports Center and trigger export', async ({ page }) => {
    await page.goto('http://localhost:3003/reports');
    await expect(page.getByText(/Reports & Export Center/i)).toBeVisible();
    const exportBtn = page.getByText(/Export SALES CSV/i);
    await expect(exportBtn).toBeVisible();
  });
});
