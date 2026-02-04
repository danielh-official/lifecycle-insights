import { expect, test } from '@playwright/test';

test.describe('Dark Mode', () => {
	test('should apply dark class when system prefers dark mode', async ({ page }) => {
		// Emulate dark color scheme preference
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');

		// Check if the html element has the 'dark' class
		const htmlElement = page.locator('html');
		await expect(htmlElement).toHaveClass(/dark/);
	});

	test('should not apply dark class when system prefers light mode', async ({ page }) => {
		// Emulate light color scheme preference
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');

		// Check if the html element does not have the 'dark' class
		const htmlElement = page.locator('html');
		await expect(htmlElement).not.toHaveClass(/dark/);
	});

	test('should have proper background color in dark mode', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');

		// Check if background is dark
		const htmlElement = page.locator('html');
		const backgroundColor = await htmlElement.evaluate((el) => {
			return window.getComputedStyle(el).backgroundColor;
		});

		// Check that background color is dark (rgb values should be low)
		expect(backgroundColor).toMatch(/rgb\(\s*17,\s*24,\s*39\)/); // gray-900
	});

	test('should have proper background color in light mode', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');

		// Check if background is light
		const htmlElement = page.locator('html');
		const backgroundColor = await htmlElement.evaluate((el) => {
			return window.getComputedStyle(el).backgroundColor;
		});

		// Check that background color is white
		expect(backgroundColor).toMatch(/rgb\(\s*255,\s*255,\s*255\)/);
	});
});
