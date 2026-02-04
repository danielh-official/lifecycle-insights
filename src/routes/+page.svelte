<script>
	import CsvImport from '$lib/components/CsvImport.svelte';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { resolve } from '$app/paths';

	const items = liveQuery(() => db.items.toArray());

	const itemsCount = $derived.by(() => {
		return $items ? $items.length : 0;
	});
</script>

<svelte:head>
	<title>Life Cycle Insights</title>
</svelte:head>

<div class="m-auto mb-8 max-w-2xl p-4 text-center">
	<h1 class="text-3xl font-bold">What is this and why?</h1>
	<p class="mt-2 text-gray-600 dark:text-gray-400">
		Life Cycle is a pretty nice app. Unfortunately, you can't view your ring for the current month.
		Thankfully, the CSV export includes the most recent data.
	</p>
	<p class="mt-2 text-gray-600 dark:text-gray-400">
		All data you import is stored locally using IndexedDB. We cannot access your data nor do we want
		to. The <a
			class="text-blue-600 hover:underline dark:text-blue-400"
			href="https://github.com/danielh-official/lifecycle-web"
			target="_blank"
			rel="noopener noreferrer">source code</a
		> is available on GitHub.
	</p>
</div>

<!-- MARK: Statement of Affiliation -->
<div class="m-auto mb-8 max-w-2xl p-4 text-center">
	<h2 class="text-2xl font-bold">Statement of Affiliation</h2>
	<p class="mt-2 text-gray-600 dark:text-gray-400">
		This project is not affiliated with or endorsed by Life Cycle or its parent company, Northcube
		AB. It is an independent initiative created to enhance user experience by providing additional
		insights into the data exported from the Life Cycle app.
	</p>
</div>

<div
	class="container m-auto mx-auto mb-8 rounded border bg-green-50 p-4 dark:border-gray-700 dark:bg-gray-800"
>
	<h2 class="mb-4 text-center text-2xl font-bold">Your Data</h2>
	{#if itemsCount === 0}
		<p class="text-center text-gray-600 dark:text-gray-400">
			No data imported yet. Use the form below to import your CSV.
		</p>
	{:else}
		<p class="text-center text-gray-600 dark:text-gray-400">
			You have {itemsCount} items imported.
		</p>
		<div class="mt-4 text-center">
			<a
				href={resolve('/insights')}
				class="rounded text-blue-600 hover:underline dark:text-blue-400">View Insights</a
			>
		</div>
	{/if}
</div>

<div class="container mx-auto">
	<CsvImport />
</div>
