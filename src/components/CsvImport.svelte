<script lang="ts">
	import { db, type Item } from '$lib/db';
	import Papa from 'papaparse';

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
			complete: (results) => {
				data = results.data as ExpectedCsvRow[];
				error = null;

				const parsedData: Omit<Item, 'id'>[] = data.map((row) => {
					const parsedDuration =
						typeof row['DURATION'] === 'string' ? parseFloat(row['DURATION']) : row['DURATION'];

					const start_date_time_utc: Date | null = new Date((row['START DATE(UTC)'] ?? '').trim());
					const end_date_time_utc: Date | null = new Date((row['END DATE(UTC)'] ?? '').trim());

					return {
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

				db.items.bulkPut(parsedData).catch((e) => {
					error = 'Failed to save data to the database: ' + e.message;
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

<div>
	<label for="csv-upload">Import Lifecycle CSV:</label>
	<input id="csv-upload" type="file" accept=".csv" on:change={handleFileChange} />
	{#if error}
		<div class="error">{error}</div>
	{/if}
	{#if data.length}
		<div class="success">Imported {data.length} rows.</div>
	{/if}
</div>
