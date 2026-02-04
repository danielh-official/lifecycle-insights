import { SvelteDate } from 'svelte/reactivity';
import { ulid } from 'ulid';
import type { Item, Category } from './db';

interface DummyDataConfig {
	startDate: Date;
	endDate: Date;
}

// Common activity categories with realistic durations
const ACTIVITY_CATEGORIES = [
	{ name: 'Sleep', avgDurationHours: 8, varianceHours: 1.5 },
	{ name: 'Work', avgDurationHours: 7, varianceHours: 2 },
	{ name: 'Exercise', avgDurationHours: 1, varianceHours: 0.5 },
	{ name: 'Meal', avgDurationHours: 0.75, varianceHours: 0.25 },
	{ name: 'Commute', avgDurationHours: 0.5, varianceHours: 0.25 },
	{ name: 'Entertainment', avgDurationHours: 2, varianceHours: 1 },
	{ name: 'Social', avgDurationHours: 2.5, varianceHours: 1.5 },
	{ name: 'Chores', avgDurationHours: 1, varianceHours: 0.5 },
	{ name: 'Reading', avgDurationHours: 1, varianceHours: 0.5 },
	{ name: 'Personal Care', avgDurationHours: 0.5, varianceHours: 0.25 }
];

const LOCATIONS = [
	'Home',
	'Office',
	'Gym',
	'Coffee Shop',
	'Park',
	'Restaurant',
	null // Some activities don't have locations
];

/**
 * Generate a random duration in seconds based on average and variance
 */
function generateDuration(avgHours: number, varianceHours: number): number {
	const variance = (Math.random() - 0.5) * 2 * varianceHours;
	const hours = Math.max(0.1, avgHours + variance);
	return Math.round(hours * 3600); // Convert to seconds
}

/**
 * Generate dummy lifecycle data for demonstration purposes
 */
export function generateDummyData(config?: Partial<DummyDataConfig>): {
	items: Item[];
	categories: Category[];
} {
	const now = new Date();
	const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
	const defaultEndDate = now;

	const startDate = config?.startDate ?? defaultStartDate;
	const endDate = config?.endDate ?? defaultEndDate;

	const items: Item[] = [];
	let currentTime = new Date(startDate);

	// Generate continuous activities from start to end date
	while (currentTime < endDate) {
		// Pick a random activity
		const activity = ACTIVITY_CATEGORIES[Math.floor(Math.random() * ACTIVITY_CATEGORIES.length)];
		const duration = generateDuration(activity.avgDurationHours, activity.varianceHours);

		const startDateTime = new Date(currentTime);
		const endDateTime = new Date(currentTime.getTime() + duration * 1000);

		// Don't go past the end date
		if (endDateTime > endDate) {
			break;
		}

		// Format dates as UTC strings (matching Lifecycle export format)
		const startDateTimeUtcString = startDateTime.toISOString().replace('T', ' ').slice(0, 19);
		const endDateTimeUtcString = endDateTime.toISOString().replace('T', ' ').slice(0, 19);

		// Random location (some activities don't have locations)
		const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

		// Occasional notes
		const note = Math.random() > 0.8 ? `Demo note for ${activity.name}` : null;

		items.push({
			id: ulid(),
			start_date_time_utc_string: startDateTimeUtcString,
			end_date_time_utc_string: endDateTimeUtcString,
			duration,
			name: activity.name,
			location,
			note,
			start_date_time_utc: new SvelteDate(startDateTime.toISOString()),
			end_date_time_utc: new SvelteDate(endDateTime.toISOString())
		});

		currentTime = endDateTime;
	}

	// Generate categories from the activities
	const categories: Category[] = ACTIVITY_CATEGORIES.map((activity) => ({
		name: activity.name,
		show_in_insights: true
	}));

	return { items, categories };
}

/**
 * Load dummy data into the database
 */
export async function loadDummyData(db: {
	items: { clear: () => Promise<void>; bulkPut: (items: Item[]) => Promise<void> };
	categories: { clear: () => Promise<void>; bulkPut: (categories: Category[]) => Promise<void> };
}): Promise<void> {
	const { items, categories } = generateDummyData();

	await db.items.clear();
	await db.categories.clear();

	await db.items.bulkPut(items);
	await db.categories.bulkPut(categories);
}
