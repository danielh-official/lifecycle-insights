<script>
	import CsvImport from '$lib/components/CsvImport.svelte';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import {
		ChartPieSolid,
		CheckCircleSolid,
		CloudArrowUpSolid,
		ShieldCheckSolid,
		ChevronDownOutline,
		ChevronUpOutline
	} from 'flowbite-svelte-icons';

	const items = liveQuery(() => db.items.toArray());

	const itemsCount = $derived.by(() => {
		return $items ? $items.length : 0;
	});

	const insightsPathLink = $derived.by(() => {
		const localStorageStartDate = localStorage.getItem('startDate');
		const localStorageEndDate = localStorage.getItem('endDate');

		const searchParams = new SvelteURLSearchParams();

		if (localStorageStartDate) {
			searchParams.set('startDate', localStorageStartDate);
		}

		if (localStorageEndDate) {
			searchParams.set('endDate', localStorageEndDate);
		}

		if (searchParams.toString()) {
			return resolve('/insights') + '?' + searchParams.toString();
		}

		return resolve('/insights');
	});

	let showDetails = $state(false);
</script>

<svelte:head>
	<title>Life Cycle Insights - Enhanced Activity Tracking</title>
</svelte:head>

<!-- Hero Section -->
<div class="bg-gradient-to-b from-blue-50 to-white py-12 dark:from-gray-800 dark:to-gray-900">
	<div class="container mx-auto max-w-4xl px-4 text-center">
		<h1 class="mb-4 text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
			Welcome to Life Cycle Insights
		</h1>
		<p class="mb-2 text-xl text-gray-700 dark:text-gray-300">
			Unlock deeper insights from your Life Cycle app data
		</p>
		<p class="mb-8 text-lg text-gray-600 dark:text-gray-400">
			View your current month's activity ring and analyze your patterns—all in your browser, 100%
			private
		</p>

		<!-- Key Features -->
		<div class="mb-8 grid gap-6 md:grid-cols-3">
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<div class="mb-3 flex justify-center">
					<ChartPieSolid class="h-12 w-12 text-blue-600 dark:text-blue-400" />
				</div>
				<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Current Month View</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					See your activity ring for the current month, not available in the Life Cycle app
				</p>
			</div>
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<div class="mb-3 flex justify-center">
					<ShieldCheckSolid class="h-12 w-12 text-green-600 dark:text-green-400" />
				</div>
				<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">100% Private</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Your data never leaves your browser. Stored locally using IndexedDB
				</p>
			</div>
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<div class="mb-3 flex justify-center">
					<CloudArrowUpSolid class="h-12 w-12 text-purple-600 dark:text-purple-400" />
				</div>
				<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Easy Import</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Simply export your CSV from Life Cycle and upload it here to get started
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Status Section -->
<div class="container mx-auto max-w-4xl px-4 py-8">
	{#if itemsCount === 0}
		<!-- Getting Started Guide -->
		<div
			class="mb-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20"
		>
			<h2 class="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
				Get Started in 3 Easy Steps
			</h2>
			<div class="space-y-6">
				<!-- Step 1 -->
				<div class="flex gap-4">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
					>
						1
					</div>
					<div class="flex-1">
						<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">
							Export from Life Cycle App
						</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Open Life Cycle → Settings → Advanced → Database → "Export Database"
						</p>
					</div>
				</div>
				<!-- Step 2 -->
				<div class="flex gap-4">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
					>
						2
					</div>
					<div class="flex-1">
						<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">Import Your CSV</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Use the upload button below to import your data
						</p>
					</div>
				</div>
				<!-- Step 3 -->
				<div class="flex gap-4">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
					>
						3
					</div>
					<div class="flex-1">
						<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">View Your Insights</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Explore your data with interactive charts and visualizations
						</p>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Success State -->
		<div
			class="mb-8 rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20"
		>
			<div class="flex items-center justify-center gap-3">
				<CheckCircleSolid class="h-8 w-8 text-green-600 dark:text-green-400" />
				<div class="text-center">
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">You're All Set! 🎉</h2>
					<p class="mt-1 text-gray-600 dark:text-gray-400">
						{itemsCount} activities imported and ready to explore
					</p>
				</div>
			</div>
			<div class="mt-6 text-center">
				<a
					href={insightsPathLink}
					class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
				>
					<ChartPieSolid class="h-5 w-5" />
					View Your Insights
				</a>
			</div>
			<div class="mt-4 text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Want to update your data? Import a new CSV below to replace the current data.
				</p>
			</div>
		</div>
	{/if}

	<!-- Import Section -->
	<div class="mb-8">
		<CsvImport />
	</div>

	<!-- Additional Information - Collapsible -->
	<div class="mt-8">
		<button
			onclick={() => (showDetails = !showDetails)}
			class="flex w-full items-center justify-between rounded-lg border bg-gray-50 p-4 text-left hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
		>
			<span class="font-semibold text-gray-900 dark:text-white">More Information</span>
			{#if showDetails}
				<ChevronUpOutline class="h-5 w-5 text-gray-600 dark:text-gray-400" />
			{:else}
				<ChevronDownOutline class="h-5 w-5 text-gray-600 dark:text-gray-400" />
			{/if}
		</button>

		{#if showDetails}
			<div
				class="space-y-6 rounded-b-lg border border-t-0 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<!-- About Section -->
				<div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
						What is this and why?
					</h3>
					<p class="mb-2 text-gray-600 dark:text-gray-400">
						Life Cycle is a pretty nice app. Unfortunately, you can't view your ring for the current
						month. Thankfully, the CSV export includes the most recent data.
					</p>
					<p class="text-gray-600 dark:text-gray-400">
						All data you import is stored locally using IndexedDB. We cannot access your data nor do
						we want to. The
						<a
							class="text-blue-600 hover:underline dark:text-blue-400"
							href="https://github.com/danielh-official/lifecycle-web"
							target="_blank"
							rel="noopener noreferrer">source code</a
						>
						is available on GitHub.
					</p>
				</div>

				<!-- Statement of Affiliation -->
				<div class="border-t pt-6 dark:border-gray-700">
					<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
						Statement of Affiliation
					</h3>
					<p class="text-gray-600 dark:text-gray-400">
						This project is not affiliated with or endorsed by Life Cycle or its parent company,
						Northcube AB. It is an independent initiative created to enhance user experience by
						providing additional insights into the data exported from the Life Cycle app.
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
