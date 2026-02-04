<script lang="ts">
	import { resolve } from '$app/paths';
	import { normalizeSeconds } from '$lib';
	import DonutChart from '$lib/components/DonutChart.svelte';
	import { db, type Category, type Item } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { SvelteDate } from 'svelte/reactivity';

	let startDate: string | null = $state(null);
	let endDate: string | null = $state(null);

	$effect(() => {
		const url = new URL(window.location.href);
		const urlStartDate = url.searchParams.get('startDate');
		const urlEndDate = url.searchParams.get('endDate');

		if (urlStartDate) {
			startDate = urlStartDate;
		}

		if (urlEndDate) {
			endDate = urlEndDate;
		}

		const localStorageStartDate = localStorage.getItem('startDate');
		const localStorageEndDate = localStorage.getItem('endDate');

		if (!urlStartDate || !urlEndDate) {
			if (!urlStartDate && localStorageStartDate) {
				startDate = localStorageStartDate;
				url.searchParams.set('startDate', startDate);
			}

			if (!urlEndDate && localStorageEndDate) {
				endDate = localStorageEndDate;
				url.searchParams.set('endDate', endDate);
			}

			window.history.replaceState({}, '', url.toString());
		}
	});

	function onStartDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		startDate = input.value;

		const url = new URL(window.location.href);
		if (startDate) {
			url.searchParams.set('startDate', startDate);
			localStorage.setItem('startDate', startDate ?? '');
		} else {
			url.searchParams.delete('startDate');
			localStorage.removeItem('startDate');
		}
		window.history.replaceState({}, '', url.toString());
	}

	function onEndDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		endDate = input.value;

		const url = new URL(window.location.href);
		if (endDate) {
			url.searchParams.set('endDate', endDate);
			localStorage.setItem('endDate', endDate ?? '');
		} else {
			url.searchParams.delete('endDate');
			localStorage.removeItem('endDate');
		}
		window.history.replaceState({}, '', url.toString());
	}

	let items = liveQuery(() => db.items.toArray());

	let filteredItems = $derived.by(() => {
		if (!$items) return [];

		return $items.filter((item) => {
			const parsedQueryParamStartDate = startDate ? new SvelteDate(startDate + 'T00:00:00Z') : null;
			const parsedQueryParamEndDate = endDate ? new SvelteDate(endDate + 'T23:59:59Z') : null;
			const noNullDates = item.start_date_time_utc !== null && item.end_date_time_utc !== null;

			return (
				noNullDates &&
				(parsedQueryParamStartDate
					? item.start_date_time_utc! >= parsedQueryParamStartDate
					: true) &&
				(parsedQueryParamEndDate ? item.end_date_time_utc! <= parsedQueryParamEndDate : true)
			);
		});
	});

	let itemsCount = $derived.by(() => {
		return filteredItems.length;
	});

	const categories = $derived.by(() => liveQuery(() => db.categories.toArray()));

	function getCategoriesWithItems(): (Category & { totalDuration: number; items: Item[] })[] {
		return ($categories ?? [])
			.map((category) => {
				const itemsForCategory = filteredItems.filter((item) => item.name === category.name);
				const totalDuration = itemsForCategory.reduce((sum, item) => sum + item.duration, 0);

				return {
					...category,
					totalDuration,
					items: itemsForCategory
				};
			})
			.filter((category) => category.items.length > 0);
	}

	let categoriesWithItems: (Category & { totalDuration: number; items: Item[] })[] = $derived.by(
		() => {
			return getCategoriesWithItems();
		}
	);

	const selectedCategories: string[] = $derived.by(() => {
		return categoriesWithItems
			.filter((category) => category.show_in_insights)
			.map((category) => category.name);
	});

	const labels = $derived.by(() => {
		return categoriesWithItems
			.filter((category) => selectedCategories.includes(category.name))
			.map((category) => category.name);
	});

	const series = $derived.by(() => {
		return categoriesWithItems
			.filter((category) => selectedCategories.includes(category.name))
			.map((category) => category.totalDuration);
	});
</script>

<svelte:head>
	<title>Insights | Life Cycle Insights</title>
</svelte:head>

<div class="m-auto mb-4 p-4">
	<a href={resolve('/')} class="text-blue-600 hover:underline dark:text-blue-400">Back to Home</a>
</div>

<!-- MARK: Date Range Inputs -->

<div class="mb-8 flex max-w-2xl gap-x-4 justify-self-center p-4">
	<div>
		<input
			type="date"
			bind:value={startDate}
			onchange={onStartDateChange}
			class="dark:bg-gray-800 dark:text-gray-300"
		/>
	</div>
	<div>
		<input
			type="date"
			bind:value={endDate}
			onchange={onEndDateChange}
			class="dark:bg-gray-800 dark:text-gray-300"
		/>
	</div>
</div>

<div class="m-auto mb-8 max-w-2xl p-4 text-center">
	<p>Getting {itemsCount} records</p>
</div>

{#if categoriesWithItems.length === 0}
	<div class="m-auto mb-8 max-w-2xl p-4 text-center">
		<p>No data available for the selected date range.</p>
	</div>
{:else}
	<!-- MARK: Donut Chart -->
	<div class="m-auto mb-8 p-4 text-center" style="justify-items: center;">
		{#if series.length > 0 && labels.length > 0}
			<DonutChart {series} {labels} />
		{:else}
			<p>Please select at least one category to display the chart.</p>
		{/if}
	</div>
{/if}

<!-- MARK: Select Categories To Show -->

<!-- A multi checkbox with all categories checked. Unchecking a category removes it from the chart. -->
<div
	class="m-auto mb-8 grid max-w-4xl grid-cols-2 gap-4 p-4 text-center sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
>
	{#each categoriesWithItems.sort((a, b) => b.totalDuration - a.totalDuration) as category (category.name)}
		<div class="me-4 flex max-w-full items-center">
			<input
				id={category.name}
				type="checkbox"
				value={category.name}
				class="border-default-medium bg-neutral-secondary-medium focus:ring-brand-soft h-4 w-4 rounded-xs border focus:ring-2 dark:border-gray-600 dark:bg-gray-700"
				checked={selectedCategories.includes(category.name)}
				onchange={(e) => {
					const checked = (e.target as HTMLInputElement).checked;
					if (checked) {
						db.categories.update(category.name, { show_in_insights: true });
						selectedCategories.push(category.name);
					} else {
						db.categories.update(category.name, { show_in_insights: false });
						const index = selectedCategories.indexOf(category.name);
						if (index > -1) {
							selectedCategories.splice(index, 1);
						}
					}
				}}
			/>
			<label
				for={category.name}
				class="text-heading ms-2 text-sm font-medium select-none dark:text-gray-300"
				>{category.name}<br />({normalizeSeconds(category.totalDuration)})</label
			>
		</div>
	{/each}
</div>
