import { expect, test } from '@playwright/test';

test.describe('Demo Data Functionality', () => {
	test('should show demo button when no data is loaded', async ({ page }) => {
		await page.goto('/');

		// Should show the demo button
		const demoButton = page.getByRole('button', { name: /Try Demo with Sample Data/i });
		await expect(demoButton).toBeVisible();
	});

	test('should load demo data and navigate to insights', async ({ page }) => {
		await page.goto('/');

		// Click the demo button
		const demoButton = page.getByRole('button', { name: /Try Demo with Sample Data/i });
		await demoButton.click();

		// Should navigate to insights page
		await expect(page).toHaveURL('/insights');

		// Should show records count
		await expect(page.getByText(/Getting \d+ records/)).toBeVisible();

		// Should show category checkboxes
		await expect(page.getByRole('checkbox', { name: /Work/ })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: /Sleep/ })).toBeVisible();
	});

	test('should show load demo button when data exists', async ({ page }) => {
		await page.goto('/');

		// Load demo data first
		const demoButton = page.getByRole('button', { name: /Try Demo with Sample Data/i });
		await demoButton.click();

		// Go back home
		await page.getByRole('link', { name: /Back to Home/i }).click();

		// Should show items count
		await expect(page.getByText(/You have \d+ items imported/)).toBeVisible();

		// Should show both View Insights and Load Demo Data buttons
		await expect(page.getByRole('link', { name: /View Insights/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /Load Demo Data/i })).toBeVisible();
	});

	test('should be able to reload demo data', async ({ page }) => {
		await page.goto('/');

		// Load demo data first time
		const firstDemoButton = page.getByRole('button', { name: /Try Demo with Sample Data/i });
		await firstDemoButton.click();

		// Go back home
		await page.getByRole('link', { name: /Back to Home/i }).click();

		// Load demo data again (should replace existing data)
		const reloadButton = page.getByRole('button', { name: /Load Demo Data/i });
		await reloadButton.click();

		// Should navigate to insights page again
		await expect(page).toHaveURL('/insights');

		// Should still show records
		await expect(page.getByText(/Getting \d+ records/)).toBeVisible();
	});
});
