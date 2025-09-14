import { test, expect } from '@playwright/test';

test.describe('Geo-OS MVP Flow', () => {
  test('should load sample data and update status', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000/');

    // 1. Check initial state
    await expect(page.getByText('No Data')).toBeVisible();

    // 2. Find and click the "Load Sample Data" button
    const loadButton = page.getByRole('button', { name: '⚡ Load Sample Data' });
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    // 3. Wait for the status to change to "Data Connected"
    // The ingestion and processing might take a few seconds.
    await expect(page.getByText('Data Connected')).toBeVisible({ timeout: 15000 });
    
    console.log('Test Success: Sample data loaded and status updated.');
  });
});
