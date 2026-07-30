import { test, expect } from '@playwright/test';

test.describe('Customer End-to-End Journey', () => {
  test('1. Customer can load homepage and view categories', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/FoodHub/i);
    await expect(page.getByText(/What are you craving today/i)).toBeVisible();
  });

  test('2. Customer can search for restaurants/dishes', async ({ page }) => {
    await page.goto('http://localhost:3000/search');
    const searchInput = page.getByPlaceholder(/Search for restaurants or dishes/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Biryani');
  });

  test('3. Customer can view Referral & Earn page', async ({ page }) => {
    await page.goto('http://localhost:3000/referral');
    await expect(page.getByText(/Refer & Earn/i)).toBeVisible();
    await expect(page.getByText(/Your Code/i)).toBeVisible();
  });
});
