<script lang="ts">
	import { resolve } from '$app/paths';
	import { db, type Item } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { SvelteDate } from 'svelte/reactivity';

	let startDate: string | null = $state(null);
	let endDate: string | null = $state(null);

	let hovered: number | null = $state(null);

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

    interface ItemDurationAndName {
        name: string;
        duration: number;
    }

    let itemDurationsGroupedByName = $derived.by(() => {
        const grouped: ItemDurationAndName[] = [];

        if ($items) {
            const durationMap: Record<string, number> = {};

            for (const item of $items) {
                if (item.name in durationMap) {
                    durationMap[item.name] += item.duration;
                } else {
                    durationMap[item.name] = item.duration;
                }
            }

            for (const name in durationMap) {
                grouped.push({
                    name,
                    duration: durationMap[name]
                });
            }
        }

        return grouped.sort((a, b) => b.duration - a.duration);
    });

    $inspect(itemDurationsGroupedByName);
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

<!-- MARK: Radial -->
<div class="my-8 flex flex-col items-center justify-center">
	<div class="relative">
		<svg width="500" height="500" viewBox="0 0 220 220" class="mb-4">
			<circle r="90" cx="110" cy="110" fill="#f3f4f6" />
			<!-- Section 1: 0-90deg -->
			<path
				d="M110,20 A90,90 0 0,1 200,110 L110,110 Z"
				fill="#60a5fa"
				onmouseenter={() => (hovered = 1)}
				onmouseleave={() => (hovered = null)}
				style="cursor:pointer;"
				role="presentation"
				aria-label="Section 1"
			/>
			<!-- Section 2: 90-180deg -->
			<path
				d="M200,110 A90,90 0 0,1 110,200 L110,110 Z"
				fill="#34d399"
				onmouseenter={() => (hovered = 2)}
				onmouseleave={() => (hovered = null)}
				style="cursor:pointer;"
				role="presentation"
				aria-label="Section 2"
			/>
			<!-- Section 3: 180-270deg -->
			<path
				d="M110,200 A90,90 0 0,1 20,110 L110,110 Z"
				fill="#fbbf24"
				onmouseenter={() => (hovered = 3)}
				onmouseleave={() => (hovered = null)}
				style="cursor:pointer;"
				role="presentation"
				aria-label="Section 3"
			/>
			<!-- Section 4: 270-360deg -->
			<path
				d="M20,110 A90,90 0 0,1 110,20 L110,110 Z"
				fill="#f87171"
				onmouseenter={() => (hovered = 4)}
				onmouseleave={() => (hovered = null)}
				style="cursor:pointer;"
				role="presentation"
				aria-label="Section 4"
			/>
			<circle r="60" cx="110" cy="110" fill="#fff" />
		</svg>
		{#if hovered}
			<div
				class="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded bg-gray-800 px-4 py-2 text-lg text-white shadow-lg"
			>
				{#if hovered === 1}Section 1{/if}
				{#if hovered === 2}Section 2{/if}
				{#if hovered === 3}Section 3{/if}
				{#if hovered === 4}Section 4{/if}
			</div>
		{/if}
	</div>
</div>
