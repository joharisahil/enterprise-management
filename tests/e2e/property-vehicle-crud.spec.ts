import { test, expect } from '@playwright/test';

const TEST_UNIQUE = Date.now();

// Helper to login before each test
async function login(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('login-email-input').fill('admin@erp.com');
  await page.getByTestId('login-password-input').fill('password123');
  await page.getByTestId('login-submit-button').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
}

test.describe('Properties CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to Properties page
    await page.getByTestId('nav-properties').click();
    await expect(page.getByTestId('properties-page')).toBeVisible({ timeout: 10000 });
  });

  test('should display properties page', async ({ page }) => {
    await expect(page.getByText('Properties')).toBeVisible();
    await expect(page.getByTestId('add-property-button')).toBeVisible();
  });

  test('should create a new property', async ({ page }) => {
    const propertyName = `TEST_Property_${TEST_UNIQUE}`;
    
    // Open create dialog
    await page.getByTestId('add-property-button').click();
    
    // Fill form
    await page.getByTestId('property-name-input').fill(propertyName);
    await page.getByTestId('property-type-select').click();
    await page.getByRole('option', { name: 'Commercial' }).click();
    await page.getByTestId('property-address-input').fill('123 Test Street, Mumbai');
    await page.getByTestId('property-area-input').fill('5000');
    
    // Submit
    await page.getByTestId('submit-property-button').click();
    
    // Verify success toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('created', { timeout: 5000 });
    
    // Verify property appears in list (find the card with this name)
    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 5000 });
  });

  test('should view property details', async ({ page }) => {
    // Get first property card
    const propertyCard = page.locator('[data-testid^="property-card-"]').first();
    await expect(propertyCard).toBeVisible();
    
    // Get the property id from data-testid
    const testId = await propertyCard.getAttribute('data-testid');
    const propertyId = testId?.replace('property-card-', '');
    
    // Click view button
    await page.getByTestId(`view-property-${propertyId}`).click();
    
    // Verify dialog opens
    await expect(page.getByText('Property Details')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a property', async ({ page }) => {
    // Create a property first
    const propertyName = `TEST_Edit_${Date.now()}`;
    await page.getByTestId('add-property-button').click();
    await page.getByTestId('property-name-input').fill(propertyName);
    await page.getByTestId('property-type-select').click();
    await page.getByRole('option', { name: 'Commercial' }).click();
    await page.getByTestId('property-address-input').fill('Edit Test Address');
    await page.getByTestId('property-area-input').fill('3000');
    await page.getByTestId('submit-property-button').click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('created', { timeout: 5000 });
    
    // Wait for property to appear
    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 5000 });
    
    // Find the property card
    const propertyCard = page.locator(`text=${propertyName}`).locator('..').locator('..').locator('..');
    const editButton = propertyCard.locator('[data-testid^="edit-property-"]');
    await editButton.click();
    
    // Edit the name
    const updatedName = `TEST_Updated_${Date.now()}`;
    await page.getByTestId('edit-property-name-input').fill(updatedName);
    await page.getByTestId('update-property-button').click();
    
    // Verify success
    await expect(page.locator('[data-sonner-toast]')).toContainText('updated', { timeout: 5000 });
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
  });

  test('should delete a property', async ({ page }) => {
    // Create a property to delete
    const propertyName = `TEST_Delete_${Date.now()}`;
    await page.getByTestId('add-property-button').click();
    await page.getByTestId('property-name-input').fill(propertyName);
    await page.getByTestId('property-type-select').click();
    await page.getByRole('option', { name: 'Industrial' }).click();
    await page.getByTestId('property-address-input').fill('Delete Test Address');
    await page.getByTestId('property-area-input').fill('2000');
    await page.getByTestId('submit-property-button').click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('created', { timeout: 5000 });
    
    // Wait for property to appear
    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 5000 });
    
    // Set up dialog handler for confirm
    page.on('dialog', dialog => dialog.accept());
    
    // Find and delete the property
    const propertyCard = page.locator(`text=${propertyName}`).locator('..').locator('..').locator('..');
    const deleteButton = propertyCard.locator('[data-testid^="delete-property-"]');
    await deleteButton.click();
    
    // Verify deletion
    await expect(page.locator('[data-sonner-toast]')).toContainText('deleted', { timeout: 5000 });
    await expect(page.getByText(propertyName)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vehicles CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to Vehicles page
    await page.getByTestId('nav-vehicles').click();
    await expect(page.getByTestId('vehicles-page')).toBeVisible({ timeout: 10000 });
  });

  test('should display vehicles page', async ({ page }) => {
    await expect(page.getByText('Fleet Management')).toBeVisible();
    await expect(page.getByTestId('add-vehicle-button')).toBeVisible();
  });

  test('should create a new vehicle', async ({ page }) => {
    const regNumber = `TEST-MH-${Date.now().toString().slice(-4)}`;
    
    // Open create dialog
    await page.getByTestId('add-vehicle-button').click();
    
    // Fill form
    await page.getByTestId('vehicle-reg-input').fill(regNumber);
    await page.getByTestId('vehicle-type-select').click();
    await page.getByRole('option', { name: 'Car' }).click();
    await page.getByTestId('vehicle-fuel-select').click();
    await page.getByRole('option', { name: 'Diesel' }).click();
    await page.getByTestId('vehicle-brand-input').fill('Tata');
    await page.getByTestId('vehicle-model-input').fill('Nexon');
    await page.getByTestId('vehicle-kmpl-input').fill('18');
    await page.getByTestId('vehicle-tank-input').fill('45');
    
    // Submit
    await page.getByTestId('submit-vehicle-button').click();
    
    // Verify success
    await expect(page.locator('[data-sonner-toast]')).toContainText('added', { timeout: 5000 });
    await expect(page.getByText(regNumber)).toBeVisible({ timeout: 5000 });
  });

  test('should view vehicle details', async ({ page }) => {
    // Get first vehicle card
    const vehicleCard = page.locator('[data-testid^="vehicle-card-"]').first();
    await expect(vehicleCard).toBeVisible();
    
    const viewButton = vehicleCard.locator('[data-testid^="view-vehicle-"]');
    await viewButton.click();
    
    // Verify dialog opens
    await expect(page.getByText('Vehicle Details')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a vehicle', async ({ page }) => {
    // Create vehicle first
    const regNumber = `TEST-MH-${Date.now().toString().slice(-4)}`;
    await page.getByTestId('add-vehicle-button').click();
    await page.getByTestId('vehicle-reg-input').fill(regNumber);
    await page.getByTestId('vehicle-type-select').click();
    await page.getByRole('option', { name: 'Van' }).click();
    await page.getByTestId('vehicle-fuel-select').click();
    await page.getByRole('option', { name: 'Petrol' }).click();
    await page.getByTestId('vehicle-brand-input').fill('Maruti');
    await page.getByTestId('vehicle-model-input').fill('Eeco');
    await page.getByTestId('vehicle-kmpl-input').fill('14');
    await page.getByTestId('vehicle-tank-input').fill('40');
    await page.getByTestId('submit-vehicle-button').click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('added', { timeout: 5000 });
    await expect(page.getByText(regNumber)).toBeVisible({ timeout: 5000 });
    
    // Find and edit
    const vehicleCard = page.locator(`text=${regNumber}`).locator('..').locator('..').locator('..');
    const editButton = vehicleCard.locator('[data-testid^="edit-vehicle-"]');
    await editButton.click();
    
    // Update brand
    await page.getByTestId('vehicle-brand-input').fill('Mahindra');
    await page.getByTestId('vehicle-model-input').fill('Bolero');
    await page.getByTestId('submit-vehicle-button').click();
    
    // Verify
    await expect(page.locator('[data-sonner-toast]')).toContainText('updated', { timeout: 5000 });
    await expect(page.getByText('Mahindra')).toBeVisible({ timeout: 5000 });
  });

  test('should delete a vehicle', async ({ page }) => {
    // Create vehicle first
    const regNumber = `DEL-MH-${Date.now().toString().slice(-4)}`;
    await page.getByTestId('add-vehicle-button').click();
    await page.getByTestId('vehicle-reg-input').fill(regNumber);
    await page.getByTestId('vehicle-type-select').click();
    await page.getByRole('option', { name: 'Bike' }).click();
    await page.getByTestId('vehicle-fuel-select').click();
    await page.getByRole('option', { name: 'Petrol' }).click();
    await page.getByTestId('vehicle-brand-input').fill('Honda');
    await page.getByTestId('vehicle-model-input').fill('Activa');
    await page.getByTestId('vehicle-kmpl-input').fill('50');
    await page.getByTestId('vehicle-tank-input').fill('6');
    await page.getByTestId('submit-vehicle-button').click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('added', { timeout: 5000 });
    await expect(page.getByText(regNumber)).toBeVisible({ timeout: 5000 });
    
    // Set up dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    // Find and delete
    const vehicleCard = page.locator(`text=${regNumber}`).locator('..').locator('..').locator('..');
    const deleteButton = vehicleCard.locator('[data-testid^="delete-vehicle-"]');
    await deleteButton.click();
    
    // Verify
    await expect(page.locator('[data-sonner-toast]')).toContainText('deleted', { timeout: 5000 });
    await expect(page.getByText(regNumber)).not.toBeVisible({ timeout: 5000 });
  });
});
