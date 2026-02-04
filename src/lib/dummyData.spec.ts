import { describe, it, expect } from 'vitest';
import { generateDummyData } from './dummyData';

describe('dummyData', () => {
	describe('generateDummyData', () => {
		it('should generate items and categories', () => {
			const { items, categories } = generateDummyData();

			expect(items).toBeDefined();
			expect(categories).toBeDefined();
			expect(items.length).toBeGreaterThan(0);
			expect(categories.length).toBeGreaterThan(0);
		});

		it('should generate items with required fields', () => {
			const { items } = generateDummyData();
			const firstItem = items[0];

			expect(firstItem.id).toBeDefined();
			expect(firstItem.name).toBeDefined();
			expect(firstItem.duration).toBeGreaterThan(0);
			expect(firstItem.start_date_time_utc_string).toBeDefined();
			expect(firstItem.end_date_time_utc_string).toBeDefined();
			expect(firstItem.start_date_time_utc).toBeDefined();
			expect(firstItem.end_date_time_utc).toBeDefined();
		});

		it('should generate items within the specified date range', () => {
			const startDate = new Date('2024-01-01');
			const endDate = new Date('2024-01-07');

			const { items } = generateDummyData({ startDate, endDate });

			expect(items.length).toBeGreaterThan(0);

			items.forEach((item) => {
				const itemStart = new Date(item.start_date_time_utc!.toString());
				const itemEnd = new Date(item.end_date_time_utc!.toString());

				expect(itemStart.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
				expect(itemEnd.getTime()).toBeLessThanOrEqual(endDate.getTime());
			});
		});

		it('should generate categories for all activity types', () => {
			const { categories } = generateDummyData();

			expect(categories.length).toBeGreaterThan(5);
			expect(categories.every((cat) => cat.show_in_insights)).toBe(true);
		});

		it('should generate continuous timeline of activities', () => {
			const { items } = generateDummyData();

			// Check that activities are sequential (end of one = start of next, approximately)
			for (let i = 0; i < items.length - 1; i++) {
				const currentEnd = new Date(items[i].end_date_time_utc!.toString());
				const nextStart = new Date(items[i + 1].start_date_time_utc!.toString());

				// Times should be very close (within a few seconds due to rounding)
				const diff = Math.abs(nextStart.getTime() - currentEnd.getTime());
				expect(diff).toBeLessThan(5000); // 5 seconds tolerance
			}
		});
	});
});
