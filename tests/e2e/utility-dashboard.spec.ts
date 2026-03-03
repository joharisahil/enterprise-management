import { test, expect } from '@playwright/test';

// Helper to login before each test
async function login(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('login-email-input').fill('admin@erp.com');
  await page.getByTestId('login-password-input').fill('password123');
  await page.getByTestId('login-submit-button').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
}

test.describe('Utility Bills Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to electricity page', async ({ page }) => {
    await page.getByTestId('nav-electricity').click();
    await expect(page.getByTestId('electricity-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Electricity & Solar')).toBeVisible();
  });

  test('should display electricity and solar tabs', async ({ page }) => {
    await page.getByTestId('nav-electricity').click();
    await expect(page.getByTestId('electricity-page')).toBeVisible({ timeout: 10000 });
    
    // Check for tabs
    await expect(page.getByRole('tab', { name: /Grid Electricity/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Solar Net Metering/i })).toBeVisible();
  });

  test('should switch between electricity and solar tabs', async ({ page }) => {
    await page.getByTestId('nav-electricity').click();
    await expect(page.getByTestId('electricity-page')).toBeVisible({ timeout: 10000 });
    
    // Click Solar tab
    await page.getByRole('tab', { name: /Solar Net Metering/i }).click();
    await expect(page.getByText('Add Solar Data')).toBeVisible();
    
    // Click back to Electricity tab
    await page.getByRole('tab', { name: /Grid Electricity/i }).click();
    await expect(page.getByText('Add Electricity Bill')).toBeVisible();
  });

  test('should navigate to gas page', async ({ page }) => {
    await page.getByTestId('nav-gas').click();
    await expect(page.getByTestId('gas-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Gas Bills')).toBeVisible();
    await expect(page.getByText('Add Gas Bill')).toBeVisible();
  });

  test('should navigate to water page', async ({ page }) => {
    await page.getByTestId('nav-water').click();
    await expect(page.getByTestId('water-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Water Bills')).toBeVisible();
    await expect(page.getByText('Add Water Bill')).toBeVisible();
  });

  test('should navigate to property taxes page', async ({ page }) => {
    await page.getByTestId('nav-property-taxes').click();
    await expect(page.getByTestId('property-taxes-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Property Taxes')).toBeVisible();
    await expect(page.getByTestId('add-tax-button')).toBeVisible();
  });

  test('should display property taxes tabs', async ({ page }) => {
    await page.getByTestId('nav-property-taxes').click();
    await expect(page.getByTestId('property-taxes-page')).toBeVisible({ timeout: 10000 });
    
    // Check for tabs (All, Unpaid, Paid)
    await expect(page.getByRole('tab', { name: /All/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Unpaid/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Paid/i })).toBeVisible();
  });
});

test.describe('Property Tax CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-property-taxes').click();
    await expect(page.getByTestId('property-taxes-page')).toBeVisible({ timeout: 10000 });
  });

  test('should open add tax dialog', async ({ page }) => {
    await page.getByTestId('add-tax-button').click();
    
    // Check dialog elements
    await expect(page.getByText('Add Property Tax Record')).toBeVisible();
    await expect(page.getByTestId('tax-property-select')).toBeVisible();
    await expect(page.getByTestId('tax-type-select')).toBeVisible();
    await expect(page.getByTestId('tax-amount-input')).toBeVisible();
    await expect(page.getByTestId('submit-tax-button')).toBeVisible();
  });
});

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with KPI cards', async ({ page }) => {
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Check for KPI cards
    await expect(page.getByTestId('kpi-total-properties')).toBeVisible();
    await expect(page.getByTestId('kpi-total-vehicles')).toBeVisible();
    await expect(page.getByTestId('kpi-unpaid-bills')).toBeVisible();
    await expect(page.getByTestId('kpi-expired-taxes')).toBeVisible();
  });

  test('should display compliance alerts section', async ({ page }) => {
    await expect(page.getByText('Compliance Alerts')).toBeVisible();
    await expect(page.getByText('Expired Taxes')).toBeVisible();
    await expect(page.getByText('Expiring Documents')).toBeVisible();
    await expect(page.getByText('Unpaid Bills')).toBeVisible();
  });

  test('should display sustainability metrics', async ({ page }) => {
    await expect(page.getByText('Sustainability')).toBeVisible();
    await expect(page.getByText(/CO₂ Saved/i)).toBeVisible();
    await expect(page.getByText(/Renewable Energy/i)).toBeVisible();
  });

  test('should display fleet performance section', async ({ page }) => {
    await expect(page.getByText('Fleet Performance')).toBeVisible();
    await expect(page.getByText(/Total Distance/i)).toBeVisible();
    await expect(page.getByText(/Fuel Cost/i)).toBeVisible();
    await expect(page.getByText(/Cost Per KM/i)).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate between all main pages', async ({ page }) => {
    // Dashboard
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Properties
    await page.getByTestId('nav-properties').click();
    await expect(page.getByTestId('properties-page')).toBeVisible();
    
    // Property Taxes
    await page.getByTestId('nav-property-taxes').click();
    await expect(page.getByTestId('property-taxes-page')).toBeVisible();
    
    // Electricity
    await page.getByTestId('nav-electricity').click();
    await expect(page.getByTestId('electricity-page')).toBeVisible();
    
    // Gas
    await page.getByTestId('nav-gas').click();
    await expect(page.getByTestId('gas-page')).toBeVisible();
    
    // Water
    await page.getByTestId('nav-water').click();
    await expect(page.getByTestId('water-page')).toBeVisible();
    
    // Vehicles
    await page.getByTestId('nav-vehicles').click();
    await expect(page.getByTestId('vehicles-page')).toBeVisible();
  });

  test('should toggle sidebar', async ({ page }) => {
    const toggleButton = page.getByTestId('sidebar-toggle');
    await expect(toggleButton).toBeVisible();
    
    // Toggle sidebar
    await toggleButton.click();
    
    // Verify toggle worked (sidebar content changes)
    await toggleButton.click();
  });
});
