<script lang="ts">
	/* eslint-disable svelte/prefer-svelte-reactivity */
	import CategoryStreakCalendar from '$lib/components/CategoryStreakCalendar.svelte';
	import type { Item } from '$lib/db';
	import { SvelteDate } from 'svelte/reactivity';

	// Generate sample data for testing
	function generateSampleData(): Item[] {
		const items: Item[] = [];
		const categories = ['Work', 'Exercise', 'Reading', 'Sleep'];
		const startDate = new Date('2024-01-01');
		const endDate = new Date('2024-12-31');

		// Generate random activity for each day
		let currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			// Randomly select 1-3 categories to be active on this day
			const numActiveCategories = Math.floor(Math.random() * 3) + 1;
			const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);

			for (let i = 0; i < numActiveCategories; i++) {
				const category = shuffledCategories[i];
				const startTime = new Date(currentDate);
				startTime.setHours(Math.floor(Math.random() * 12) + 8); // Between 8 AM and 8 PM

				const endTime = new Date(startTime);
				endTime.setHours(startTime.getHours() + Math.floor(Math.random() * 3) + 1); // 1-4 hours

				const duration = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

				items.push({
					id: `${category}-${currentDate.toISOString()}`,
					start_date_time_utc_string: startTime.toISOString(),
					end_date_time_utc_string: endTime.toISOString(),
					duration,
					name: category,
					location: null,
					note: null,
					start_date_time_utc: new SvelteDate(startTime.toISOString()),
					end_date_time_utc: new SvelteDate(endTime.toISOString())
				});
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		return items;
	}

	let sampleData = $state<Item[]>(generateSampleData());

	// Group by category
	let categories = $derived.by(() => {
		const categoryMap = new Map<string, Item[]>();
		sampleData.forEach((item) => {
			if (!categoryMap.has(item.name)) {
				categoryMap.set(item.name, []);
			}
			categoryMap.get(item.name)!.push(item);
		});

		return Array.from(categoryMap.entries()).map(([name, items]) => ({
			name,
			items
		}));
	});
</script>

<svelte:head>
	<title>Test Category Streak Calendar | Life Cycle Insights</title>
</svelte:head>

<div class="m-auto mb-4 bg-white p-4">
	<h1 class="mb-4 text-2xl font-bold">Test Category Streak Calendar</h1>
	<p class="mb-4 text-gray-600">
		This page displays sample calendars with randomly generated activity data for 2024.
	</p>
</div>

<div class="m-auto mb-8 max-w-6xl p-4">
	{#if categories.length > 0}
		{#each categories as category (category.name)}
			<CategoryStreakCalendar categoryName={category.name} items={category.items} />
		{/each}
	{:else}
		<p class="text-center text-gray-500">Loading sample data...</p>
	{/if}
</div>
