<script lang="ts">
	import { resolve } from '$app/paths';
	import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
	import { db, type Item, type Category } from '$lib/db';
	import {
		findDriveFileByName,
		createDriveJsonFile,
		updateDriveJsonFile,
		downloadDriveJsonFile
	} from '$lib/googleDriveClient';
	import { SvelteDate } from 'svelte/reactivity';

	type TokenClientResponse = {
		access_token: string;
		expires_in?: number;
		scope?: string;
		token_type?: string;
		error?: string;
		error_description?: string;
	};

	type TokenClient = {
		callback: (response: TokenClientResponse) => void;
		requestAccessToken: (options?: { prompt?: string }) => void;
	};

	const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
	const TOKEN_KEYS = {
		accessToken: 'google_drive_access_token',
		expiresAt: 'google_drive_expires_at',
		fileId: 'google_drive_file_id',
		filePath: 'google_drive_file_path'
	};

	let statusMessage = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let isConnecting = $state(false);
	let isUploading = $state(false);
	let isDownloading = $state(false);
	let accessToken = $state<string | null>(null);
	let accessTokenExpiresAt = $state<number | null>(null);
	let driveFileId: string = $state('');
	let driveFilePath: string = $state('lifecycle-insights/sync.json');

	function onDriveFilePathUpdate(e: Event) {
		driveFilePath = (e.target as HTMLInputElement).value;

		localStorage.setItem(TOKEN_KEYS.filePath, driveFilePath);
	}

	driveFilePath = localStorage.getItem(TOKEN_KEYS.filePath) ?? '';

	let initialized = false;
	let tokenClient: TokenClient | null = null;
	let googleReadyPromise: Promise<void> | null = null;

	const isConnected = $derived.by(() => Boolean(accessToken));
	const isBusy = $derived.by(() => isConnecting || isUploading || isDownloading);

	function setStatus(message: string) {
		statusMessage = message;
		errorMessage = null;
	}

	function setError(message: string) {
		errorMessage = message;
		statusMessage = null;
	}

	function clearMessages() {
		statusMessage = null;
		errorMessage = null;
	}

	function getErrorMessage(error: unknown, fallback: string) {
		if (error instanceof Error) return error.message;
		if (typeof error === 'string') return error;
		return fallback;
	}

	function hydrateFromStorage() {
		accessToken = sessionStorage.getItem(TOKEN_KEYS.accessToken);
		const rawExpiresAt = sessionStorage.getItem(TOKEN_KEYS.expiresAt);
		accessTokenExpiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;
		driveFileId = localStorage.getItem(TOKEN_KEYS.fileId) ?? '';
	}

	function persistTokens(params: { accessToken: string; expiresAt: number }) {
		accessToken = params.accessToken;
		accessTokenExpiresAt = params.expiresAt;
		sessionStorage.setItem(TOKEN_KEYS.accessToken, accessToken);
		sessionStorage.setItem(TOKEN_KEYS.expiresAt, String(accessTokenExpiresAt));
	}

	function clearTokens() {
		accessToken = null;
		accessTokenExpiresAt = null;
		sessionStorage.removeItem(TOKEN_KEYS.accessToken);
		sessionStorage.removeItem(TOKEN_KEYS.expiresAt);
		sessionStorage.removeItem('google_drive_refresh_token');
		sessionStorage.removeItem('google_drive_code_verifier');
		sessionStorage.removeItem('google_drive_oauth_state');
	}

	function clearFileId() {
		localStorage.removeItem(TOKEN_KEYS.fileId);
	}

	function waitForGoogleIdentity() {
		if (window.google?.accounts?.oauth2) {
			return Promise.resolve();
		}

		if (googleReadyPromise) {
			return googleReadyPromise;
		}

		googleReadyPromise = new Promise((resolve, reject) => {
			const start = Date.now();
			const interval = window.setInterval(() => {
				if (window.google?.accounts?.oauth2) {
					window.clearInterval(interval);
					resolve();
					return;
				}
				if (Date.now() - start > 10000) {
					window.clearInterval(interval);
					reject(new Error('Google Identity Services failed to load.'));
				}
			}, 100);
		});

		return googleReadyPromise;
	}

	async function getTokenClient() {
		await waitForGoogleIdentity();

		if (!tokenClient) {
			tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
				client_id: PUBLIC_GOOGLE_CLIENT_ID,
				scope: DRIVE_SCOPE,
				callback: () => {}
			});
		}

		return tokenClient;
	}

	function mapTokenError(response: TokenClientResponse) {
		if (response.error_description) return response.error_description;
		if (response.error === 'interaction_required') {
			return 'Please reconnect to Google Drive to continue syncing.';
		}
		return 'Failed to authorize with Google Drive.';
	}

	async function requestAccessToken(prompt: '' | 'consent') {
		if (!PUBLIC_GOOGLE_CLIENT_ID) {
			setError('Missing PUBLIC_GOOGLE_CLIENT_ID environment variable.');
			return null;
		}

		try {
			const client = await getTokenClient();

			if (!client) {
				setError('Failed to initialize Google Identity client.');
				return null;
			}

			return await new Promise<string | null>((resolve) => {
				client.callback = (response) => {
					if (response.error) {
						setError(mapTokenError(response));
						resolve(null);
						return;
					}

					const expiresIn = response.expires_in ?? 3600;
					persistTokens({
						accessToken: response.access_token,
						expiresAt: Date.now() + expiresIn * 1000
					});
					setStatus('Google Drive connected.');
					resolve(response.access_token);
				};

				client.requestAccessToken({ prompt });
			});
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to start Google Drive auth.'));
			return null;
		}
	}

	async function connectToGoogle() {
		clearMessages();
		if (!PUBLIC_GOOGLE_CLIENT_ID) {
			setError('Missing PUBLIC_GOOGLE_CLIENT_ID environment variable.');
			return;
		}
		isConnecting = true;
		try {
			await requestAccessToken('consent');
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to start Google Drive auth.'));
		} finally {
			isConnecting = false;
		}
	}

	function disconnectFromGoogle() {
		clearMessages();
		clearTokens();
		clearFileId();
		setStatus('Disconnected from Google Drive.');
	}

	if (typeof window !== 'undefined' && !initialized) {
		initialized = true;
		hydrateFromStorage();
	}

	function ensureAccessToken(): string | null {
		if (!accessToken) {
			setError('You are not connected to Google Drive. Please connect first.');
			return null;
		}
		if (accessTokenExpiresAt && Date.now() >= accessTokenExpiresAt) {
			setError('Your access token has expired. Please reconnect to Google Drive.');
			clearTokens();
			return null;
		}
		return accessToken;
	}

	function serializeItem(item: Item) {
		return {
			id: item.id,
			start_date_time_utc_string: item.start_date_time_utc_string,
			end_date_time_utc_string: item.end_date_time_utc_string,
			duration: item.duration,
			name: item.name,
			location: item.location,
			note: item.note,
			start_date_time_utc: item.start_date_time_utc?.toISOString() ?? null,
			end_date_time_utc: item.end_date_time_utc?.toISOString() ?? null
		};
	}

	async function buildExportJson(): Promise<string> {
		const [items, categories] = await Promise.all([db.items.toArray(), db.categories.toArray()]);

		return JSON.stringify(
			{
				version: 1,
				exportedAt: new Date().toISOString(),
				items: items.map(serializeItem),
				categories
			},
			null,
			2
		);
	}

	async function syncDataToGoogleDrive() {
		if (
			!confirm(
				`This will overwrite the current file in Google Drive at "${driveFilePath}" with your local data. Do you want to continue?`
			)
		) {
			return;
		}

		clearMessages();
		isUploading = true;

		try {
			const token = ensureAccessToken();
			if (!token) return;

			if (!driveFilePath.trim()) {
				setError('Please enter a file path.');
				return;
			}

			const json = await buildExportJson();
			const existingFile = await findDriveFileByName({
				accessToken: token,
				name: driveFilePath
			});

			let resultFile;
			if (existingFile) {
				resultFile = await updateDriveJsonFile({
					accessToken: token,
					fileId: existingFile.id,
					json
				});
			} else {
				resultFile = await createDriveJsonFile({
					accessToken: token,
					name: driveFilePath,
					json
				});
			}

			driveFileId = resultFile.id;
			localStorage.setItem(TOKEN_KEYS.fileId, resultFile.id);

			const modifiedLabel = resultFile.modifiedTime
				? ` (modified ${new Date(resultFile.modifiedTime).toLocaleString()})`
				: '';
			setStatus(
				`Successfully ${existingFile ? 'updated' : 'created'} "${resultFile.name}"${modifiedLabel}.`
			);
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to sync to Google Drive.'));
		} finally {
			isUploading = false;
		}
	}

	function deserializeItem(raw: Record<string, unknown>): Item {
		return {
			id: raw.id as string,
			start_date_time_utc_string: raw.start_date_time_utc_string as string,
			end_date_time_utc_string: raw.end_date_time_utc_string as string,
			duration: raw.duration as number,
			name: raw.name as string,
			location: (raw.location as string | null) ?? null,
			note: (raw.note as string | null) ?? null,
			start_date_time_utc: raw.start_date_time_utc
				? new SvelteDate(raw.start_date_time_utc as string)
				: null,
			end_date_time_utc: raw.end_date_time_utc
				? new SvelteDate(raw.end_date_time_utc as string)
				: null
		};
	}

	async function syncDataFromGoogleDrive() {
		if (
			!confirm(
				`This will overwrite your local data with the current file in Google Drive at "${driveFilePath}". Do you want to continue?`
			)
		) {
			return;
		}

		clearMessages();
		isDownloading = true;

		try {
			const token = ensureAccessToken();
			if (!token) return;

			if (!driveFilePath.trim()) {
				setError('Please enter a file path.');
				return;
			}

			const existingFile = await findDriveFileByName({
				accessToken: token,
				name: driveFilePath
			});

			if (!existingFile) {
				setError(`No file found in Google Drive at "${driveFilePath}".`);
				return;
			}

			const text = await downloadDriveJsonFile({
				accessToken: token,
				fileId: existingFile.id
			});

			const data = JSON.parse(text);

			if (data.version !== 1) {
				throw new Error(`Unsupported file version: ${data.version}`);
			}

			if (!Array.isArray(data.items) || !Array.isArray(data.categories)) {
				throw new Error('Invalid file format: missing items or categories array.');
			}

			const items: Item[] = data.items.map(deserializeItem);
			const categories: Category[] = data.categories.map(
				(raw: Record<string, unknown>) =>
					({
						name: raw.name as string,
						show_in_insights: Boolean(raw.show_in_insights)
					}) as Category
			);

			await db.transaction('rw', db.items, db.categories, async () => {
				await db.items.clear();
				await db.categories.clear();
				await db.items.bulkPut(items);
				await db.categories.bulkPut(categories);
			});

			driveFileId = existingFile.id;
			localStorage.setItem(TOKEN_KEYS.fileId, existingFile.id);

			setStatus(
				`Successfully imported ${items.length} items and ${categories.length} categories from "${existingFile.name}".`
			);
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to sync from Google Drive.'));
		} finally {
			isDownloading = false;
		}
	}
</script>

<svelte:head>
	<title>Google Drive Sync | Life Cycle Insights</title>
	<script src="https://accounts.google.com/gsi/client" async defer></script>
</svelte:head>

<div class="m-auto mb-4 p-4">
	<a href={resolve('/insights')} class="text-lg text-blue-600 hover:underline dark:text-blue-400"
		>&larr; Return To Insights</a
	>
</div>

<div class="m-auto max-w-3xl space-y-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Google Drive Sync</h1>
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Manual sync stores a single JSON snapshot in your Drive. Nothing syncs automatically.
		</p>
	</div>

	<div
		class="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200"
	>
		<p>
			This uses the Drive file scope, which only allows access to files this app creates. Your data
			stays local unless you click a sync button.
		</p>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		{#if isConnected}
			<div class="flex flex-col gap-3">
				<div class="flex flex-wrap items-center gap-3">
					<span
						class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200"
						>Connected</span
					>
					<button
						onclick={disconnectFromGoogle}
						class="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
						disabled={isBusy}
					>
						Disconnect
					</button>
					<div class="ml-auto text-xs text-gray-500 dark:text-gray-400">
						Access token expires at: {accessTokenExpiresAt
							? new Date(accessTokenExpiresAt).toLocaleString()
							: 'N/A'}
					</div>
				</div>
				<div
					class="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
				>
					<div class="mb-2 flex flex-col items-center gap-2">
						<label for="filePath">File Path</label>
						<input
							id="filePath"
							type="text"
							class="ml-2 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
							value={driveFilePath}
							oninput={onDriveFilePathUpdate}
						/>
						<p class="text-xs text-gray-500 dark:text-gray-400">Leave empty for root directory</p>
					</div>
					<button
						class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
						onclick={syncDataToGoogleDrive}
						disabled={isBusy}>Sync Data to Google Drive</button
					>

					<button
						class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
						onclick={syncDataFromGoogleDrive}
						disabled={isBusy}>Sync Data from Google Drive</button
					>
				</div>
			</div>
		{:else}
			<span
				class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
				>Not connected</span
			>
			<button
				onclick={connectToGoogle}
				class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
				disabled={isBusy}
			>
				Connect Google Drive
			</button>
		{/if}
	</div>

	{#if errorMessage}
		<div
			class="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
		>
			{errorMessage}
		</div>
	{/if}

	{#if statusMessage}
		<div
			class="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200"
		>
			{statusMessage}
		</div>
	{/if}
</div>
