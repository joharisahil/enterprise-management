import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

export async function login(page: Page, email: string = 'admin@erp.com', password: string = 'password123') {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Fill login form
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-button').click();
  
  // Wait for dashboard to load
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
}

export async function navigateToPage(page: Page, pageName: string) {
  // Click on sidebar navigation
  await page.getByTestId(`nav-${pageName}`).click();
  await page.waitForLoadState('domcontentloaded');
}
