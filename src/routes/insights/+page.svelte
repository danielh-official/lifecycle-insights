<script lang="ts">
	import { resolve } from '$app/paths';
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
	});

	function onStartDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		startDate = input.value;

		const url = new URL(window.location.href);
		if (startDate) {
			url.searchParams.set('startDate', startDate);
		} else {
			url.searchParams.delete('startDate');
		}
		window.history.replaceState({}, '', url.toString());
	}

	function onEndDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		endDate = input.value;

		const url = new URL(window.location.href);
		if (endDate) {
			url.searchParams.set('endDate', endDate);
		} else {
			url.searchParams.delete('endDate');
		}
		window.history.replaceState({}, '', url.toString());
	}

	let items = liveQuery(() =>
		db.items.toArray().then((items: Item[]) => {
			return items.filter((item) => {
				const parsedQueryParamStartDate = startDate
					? new SvelteDate(startDate + 'T00:00:00Z')
					: null;
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
		})
	);

	let itemsCount = $derived.by(() => {
		return $items ? $items.length : 0;
	});

	const categories = liveQuery(() => db.categories.toArray());

	let categoriesWithItems: (Category & { totalDuration: number; items: Item[] })[] = $derived.by(
		() => {
			const cats = $categories ?? [];
			const its = $items ?? [];

			return cats
				.map((cat) => {
					const itemsForCategory = its.filter((item) => item.name === cat.name);
					const totalDuration = itemsForCategory.reduce((sum, item) => sum + item.duration, 0);

					return {
						...cat,
						totalDuration,
						items: itemsForCategory
					};
				})
				.filter((cat) => cat.items.length > 0);
		}
	);

	const labels = $derived.by(() => {
		return categoriesWithItems.map((cat) => cat.name);
	});

	const colors = $derived.by(() => {
		return categoriesWithItems.map((cat) => cat.color);
	});

	const series = $derived.by(() => {
		return categoriesWithItems.map((cat) => cat.totalDuration);
	});
</script>

<svelte:head>
	<title>Insights | Life Cycle Insights</title>
</svelte:head>

<div class="m-auto mb-4 bg-white p-4">
	Back to <a href={resolve('/')} class="text-blue-600 hover:underline">Home</a>
</div>

<!-- MARK: Date Range Inputs -->

<div class="m-auto mb-8 max-w-2xl p-4 text-center">
	<input type="date" bind:value={startDate} onchange={onStartDateChange} />
	<input type="date" bind:value={endDate} onchange={onEndDateChange} />
</div>

<div class="m-auto mb-8 max-w-2xl p-4 text-center">
	<p>Getting {itemsCount} records</p>
</div>

<!-- TODO: Make dyanmic below -->

{#if categoriesWithItems.length === 0}
	<div class="m-auto mb-8 max-w-2xl p-4 text-center">
		<p>No data available for the selected date range.</p>
	</div>
{:else}
	<!-- MARK: Donut Chart -->
	<div class="m-auto mb-8 max-w-2xl p-4 text-center" style="justify-items: center;">
		<DonutChart {colors} {series} {labels} />
	</div>
{/if}
