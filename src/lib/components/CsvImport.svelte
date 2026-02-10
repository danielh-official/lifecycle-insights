<script lang="ts">
	import { db, type Category, type Item } from '$lib/db';
	import Papa from 'papaparse';
	import { SvelteDate } from 'svelte/reactivity';
	import { ulid } from 'ulid';
	import { CloudArrowUpSolid, ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';

	let csvFile: File | null = null;
	let error = $state<string | null>(null);
	let data = $state<ExpectedCsvRow[]>([]);
	let showInstructions = $state(false);

	interface ExpectedCsvRow {
		'START DATE(UTC)': string | null;
		'END DATE(UTC)': string | null;
		'START TIME(LOCAL)': string | null;
		'END TIME(LOCAL)': string | null;
		DURATION: string | number | null;
		NAME: string | null;
		LOCATION: string | null;
		NOTE: string | null;
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;

		if (input.files === null || input.files.length === 0) {
			error = 'No file selected.';
			data = [];
			return;
		}

		csvFile = input.files[0];
		error = null;

		if (!csvFile) return;

		Papa.parse(csvFile, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (header) => header.trim(),
			complete: async (results) => {
				data = results.data as ExpectedCsvRow[];
				error = null;

				const parsedData: Item[] = data.map((row) => {
					const parsedDuration =
						typeof row['DURATION'] === 'string' ? parseFloat(row['DURATION']) : row['DURATION'];

					let startDate: string | null = row['START DATE(UTC)'];
					let endDate: string | null = row['END DATE(UTC)'];

					let start_date_time_utc: SvelteDate | null = null;

					if (startDate) {
						startDate = startDate.trim().replace(' ', 'T') + 'Z';
						start_date_time_utc = new SvelteDate(startDate);
					}

					let end_date_time_utc: SvelteDate | null = null;

					if (endDate) {
						endDate = endDate.trim().replace(' ', 'T') + 'Z';
						end_date_time_utc = new SvelteDate(endDate);
					}

					const newId = ulid();

					return {
						id: newId,
						start_date_time_utc_string: (row['START DATE(UTC)'] ?? '').trim(),
						end_date_time_utc_string: (row['END DATE(UTC)'] ?? '').trim(),
						duration: parsedDuration ?? 0,
						name: (row['NAME'] ?? '').trim(),
						location: (row['LOCATION'] ?? '').trim() || null,
						note: (row['NOTE'] ?? '').trim() || null,
						start_date_time_utc,
						end_date_time_utc
					};
				});

				await db.items.clear().catch((e) => {
					error = 'Failed to clear existing data: ' + e.message;
					alert(error);
				});

				db.items.bulkPut(parsedData).catch((e) => {
					error = 'Failed to save data to the database: ' + e.message;
					alert(error);
				});

				// Get all unique names within items and log them with a random color
				const uniqueNames = Array.from(new Set(parsedData.map((item) => item.name)));

				const categories: Category[] = uniqueNames.map((name) => {
					return {
						name,
						show_in_insights: true
					};
				});

				db.categories.bulkPut(categories).catch((e) => {
					error = 'Failed to save categories to the database: ' + e.message;
					alert(error);
				});
			},
			error: (err) => {
				error = err.message;
				data = [];
			}
		});
	}
</script>

<div class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
	<div class="mb-4 text-center">
		<h2 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">Import Your Data</h2>
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Upload your Life Cycle CSV export to get started
		</p>
	</div>

	<div class="flex flex-col items-center gap-4">
		<label
			for="csv-upload"
			class="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-gray-600"
		>
			<CloudArrowUpSolid class="h-12 w-12 text-gray-400 dark:text-gray-500" />
			<span class="font-medium text-gray-700 dark:text-gray-300">Choose CSV File</span>
			<span class="text-sm text-gray-500 dark:text-gray-400">or drag and drop here</span>
		</label>
		<input id="csv-upload" class="hidden" type="file" accept=".csv" onchange={handleFileChange} />
	</div>

	{#if error}
		<div
			class="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
		>
			<p class="font-medium">Error</p>
			<p class="text-sm">{error}</p>
		</div>
	{/if}
	{#if data.length}
		<div
			class="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
		>
			<p class="font-medium">✓ Success!</p>
			<p class="text-sm">
				Imported {data.length} activities. Refresh the page to see your insights.
			</p>
		</div>
	{/if}

	<!-- Instructions Toggle -->
	<div class="mt-6">
		<button
			onclick={() => (showInstructions = !showInstructions)}
			class="flex w-full items-center justify-between rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
		>
			<span class="text-sm font-medium text-gray-900 dark:text-white"
				>Need help? View detailed instructions</span
			>
			{#if showInstructions}
				<ChevronUpOutline class="h-4 w-4 text-gray-600 dark:text-gray-400" />
			{:else}
				<ChevronDownOutline class="h-4 w-4 text-gray-600 dark:text-gray-400" />
			{/if}
		</button>

		{#if showInstructions}
			<div class="mt-4 space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
				<!-- How To Use -->
				<div>
					<p class="mb-2 font-semibold text-gray-900 dark:text-white">How To Export</p>
					<ol class="list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
						<li>Open Lifecycle App.</li>
						<li>Go to Settings &gt; Advanced &gt; Database.</li>
						<li>Click "Export Database".</li>
						<li>Share the CSV to somewhere accessible (e.g., Apple Notes).</li>
						<li>Import the CSV file here using the file input above.</li>
					</ol>
				</div>

				<!-- Tips -->
				<div class="border-t pt-4 dark:border-gray-600">
					<p class="mb-2 font-semibold text-gray-900 dark:text-white">Tips</p>
					<ul class="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
						<li>Import the CSV as-is without modifications.</li>
						<li>
							If there are problems, check if any of your "names" (i.e., categories) or "locations"
							contain commas. Commas can cause issues with CSV parsing.
						</li>
					</ul>
				</div>

				<!-- Expected Columns -->
				<div class="border-t pt-4 dark:border-gray-600">
					<p class="mb-2 font-semibold text-gray-900 dark:text-white">Expected CSV Columns</p>
					<ul class="grid grid-cols-2 gap-1 text-sm text-gray-600 dark:text-gray-400">
						<li>• START DATE(UTC)</li>
						<li>• END DATE(UTC)</li>
						<li>• START TIME(LOCAL)</li>
						<li>• END TIME(LOCAL)</li>
						<li>• DURATION</li>
						<li>• NAME</li>
						<li>• LOCATION</li>
						<li>• NOTE</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>
