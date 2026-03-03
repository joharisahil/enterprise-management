import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByTestId('login-email-input').fill('admin@erp.com');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-button').click();
    
    // Wait for dashboard to load
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByTestId('login-email-input').fill('admin@erp.com');
    await page.getByTestId('login-password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-button').click();
    
    // Should stay on login page - dashboard should not appear
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('dashboard-page')).not.toBeVisible({ timeout: 3000 });
  });

  test('should navigate to dashboard after login', async ({ page }) => {
    await page.getByTestId('login-email-input').fill('admin@erp.com');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-button').click();
    
    // Verify dashboard elements
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Enterprise Dashboard')).toBeVisible();
  });

  test('should have sidebar navigation visible after login', async ({ page }) => {
    await page.getByTestId('login-email-input').fill('admin@erp.com');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-button').click();
    
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
    
    // Check sidebar navigation items
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-properties')).toBeVisible();
    await expect(page.getByTestId('nav-vehicles')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByTestId('login-email-input').fill('admin@erp.com');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-button').click();
    
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
    
    // Logout
    await page.getByTestId('logout-button').click();
    
    // Should redirect to login page
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
  });
});
