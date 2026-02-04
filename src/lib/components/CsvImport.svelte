<script lang="ts">
	import { db, type Category, type Item } from '$lib/db';
	import Papa from 'papaparse';
	import { SvelteDate } from 'svelte/reactivity';
	import { ulid } from 'ulid';

	let csvFile: File | null = null;
	let error: string | null = null;
	let data: ExpectedCsvRow[] = [];

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

<div class="m-auto mb-4 rounded border bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
	<label for="csv-upload" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
		>Import Lifecycle CSV</label
	>
	<input
		id="csv-upload"
		class="file:cursor-pointer file:rounded file:border file:border-gray-300 file:bg-gray-50 file:p-2 hover:file:bg-gray-100 dark:text-gray-300 dark:file:border-gray-600 dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
		style="text-align-last: center;"
		type="file"
		accept=".csv"
		on:change={handleFileChange}
	/>
	{#if error}
		<div class="error">{error}</div>
	{/if}
	{#if data.length}
		<div class="success">Imported {data.length} rows.</div>
	{/if}
</div>
<div class="mt-4 rounded border bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/30">
	<p class="font-semibold">How To Use</p>
	<ol class="list-inside list-decimal">
		<li>Open Lifecycle App.</li>
		<li>Go to Settings &gt; Advanced &gt; Database.</li>
		<li>Click "Export Database".</li>
		<li>Share the CSV to somewhere accessible (e.g., Apple Notes).</li>
		<li>Import the CSV file here using the file input above.</li>
	</ol>
</div>
<div class="mt-4 rounded border bg-yellow-50 p-4 dark:border-gray-700 dark:bg-yellow-900/30">
	<p class="font-semibold">Tips</p>
	<ul class="list-inside list-disc">
		<li>Import the CSV as-is.</li>
		<li>
			If there are problems, check if any of your "names" (i.e., categories) or "locations" contain
			commas. Commas can cause issues with CSV parsing.
		</li>
	</ul>
</div>
<div class="mt-4 rounded border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
	<p class="font-semibold">Expected CSV Columns</p>
	<ul class="list-inside list-disc">
		<li>START DATE(UTC)</li>
		<li>END DATE(UTC)</li>
		<li>START TIME(LOCAL)</li>
		<li>END TIME(LOCAL)</li>
		<li>DURATION</li>
		<li>NAME</li>
		<li>LOCATION</li>
		<li>NOTE</li>
	</ul>
</div>
