import { test, expect } from '@playwright/test';

// Helper to login
async function login(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('login-email-input').fill('admin@erp.com');
  await page.getByTestId('login-password-input').fill('password123');
  await page.getByTestId('login-submit-button').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('Properties CRUD', () => {
  test('should create and delete a property', async ({ page }) => {
    await login(page);
    
    // Navigate to Properties
    await page.getByTestId('nav-properties').click();
    await expect(page.getByTestId('properties-page')).toBeVisible({ timeout: 10000 });
    
    // Create property
    const propertyName = `TEST_Prop_${Date.now()}`;
    await page.getByTestId('add-property-button').click();
    await page.getByTestId('property-name-input').fill(propertyName);
    await page.getByTestId('property-type-select').click();
    await page.getByRole('option', { name: 'Commercial' }).click();
    await page.getByTestId('property-address-input').fill('123 Test Street');
    await page.getByTestId('property-area-input').fill('5000');
    await page.getByTestId('submit-property-button').click();
    
    // Verify created
    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 10000 });
    
    // Setup dialog handler and delete
    page.on('dialog', dialog => dialog.accept());
    const propertyCard = page.locator(`text=${propertyName}`).locator('..').locator('..').locator('..');
    await propertyCard.locator('[data-testid^="delete-property-"]').click();
    
    // Verify deleted
    await expect(page.getByText(propertyName)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vehicles CRUD', () => {
  test('should create and delete a vehicle', async ({ page }) => {
    await login(page);
    
    // Navigate to Vehicles
    await page.getByTestId('nav-vehicles').click();
    await expect(page.getByTestId('vehicles-page')).toBeVisible({ timeout: 10000 });
    
    // Create vehicle
    const regNumber = `TEST-MH-${Date.now().toString().slice(-4)}`;
    await page.getByTestId('add-vehicle-button').click();
    await page.getByTestId('vehicle-reg-input').fill(regNumber);
    await page.getByTestId('vehicle-type-select').click();
    await page.getByRole('option', { name: 'Car' }).click();
    await page.getByTestId('vehicle-fuel-select').click();
    await page.getByRole('option', { name: 'Diesel' }).click();
    await page.getByTestId('vehicle-brand-input').fill('Tata');
    await page.getByTestId('vehicle-model-input').fill('Nexon');
    await page.getByTestId('vehicle-kmpl-input').fill('18');
    await page.getByTestId('vehicle-tank-input').fill('45');
    await page.getByTestId('submit-vehicle-button').click();
    
    // Verify created
    await expect(page.getByText(regNumber)).toBeVisible({ timeout: 10000 });
    
    // Setup dialog handler and delete
    page.on('dialog', dialog => dialog.accept());
    const vehicleCard = page.locator(`text=${regNumber}`).locator('..').locator('..').locator('..');
    await vehicleCard.locator('[data-testid^="delete-vehicle-"]').click();
    
    // Verify deleted
    await expect(page.getByText(regNumber)).not.toBeVisible({ timeout: 5000 });
  });
});
