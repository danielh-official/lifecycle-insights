import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { SvelteDate } from 'svelte/reactivity';
import CategoryStreakCalendar from './CategoryStreakCalendar.svelte';
import type { Item } from '$lib/db';

describe('CategoryStreakCalendar', () => {
	it('should render calendar with category name and year', async () => {
		const mockItems: Item[] = [
			{
				id: '1',
				start_date_time_utc_string: '2024-01-15T10:00:00Z',
				end_date_time_utc_string: '2024-01-15T11:00:00Z',
				duration: 3600,
				name: 'Work',
				location: null,
				note: null,
				start_date_time_utc: new SvelteDate('2024-01-15T10:00:00Z'),
				end_date_time_utc: new SvelteDate('2024-01-15T11:00:00Z')
			}
		];

		render(CategoryStreakCalendar, {
			props: {
				categoryName: 'Work',
				items: mockItems
			}
		});

		// Check that the category name and current year are displayed
		const heading = page.getByRole('heading', { level: 3 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(heading).toHaveTextContent('Work');

		// Check that navigation buttons exist
		const previousButton = page.getByRole('button', { name: /Previous/i });
		const nextButton = page.getByRole('button', { name: /Next/i });
		await expect.element(previousButton).toBeInTheDocument();
		await expect.element(nextButton).toBeInTheDocument();
	});

	it('should render all 12 months', async () => {
		const mockItems: Item[] = [];

		render(CategoryStreakCalendar, {
			props: {
				categoryName: 'Exercise',
				items: mockItems
			}
		});

		// Check that all month names are displayed
		const monthNames = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];

		for (const month of monthNames) {
			const monthElement = page.getByText(month, { exact: true });
			await expect.element(monthElement).toBeInTheDocument();
		}
	});

	it('should navigate to previous and next years', async () => {
		const mockItems: Item[] = [];
		const currentYear = new Date().getFullYear();

		render(CategoryStreakCalendar, {
			props: {
				categoryName: 'Reading',
				items: mockItems
			}
		});

		// Check current year is displayed
		const heading = page.getByRole('heading', { level: 3 });
		await expect.element(heading).toHaveTextContent(`Reading - ${currentYear}`);

		// Click previous year button
		const previousButton = page.getByRole('button', { name: /Previous/i });
		await previousButton.click();

		// Check that year changed
		await expect.element(heading).toHaveTextContent(`Reading - ${currentYear - 1}`);

		// Click next year button twice
		const nextButton = page.getByRole('button', { name: /Next/i });
		await nextButton.click();
		await nextButton.click();

		// Check that year changed back and forward
		await expect.element(heading).toHaveTextContent(`Reading - ${currentYear + 1}`);
	});
});
