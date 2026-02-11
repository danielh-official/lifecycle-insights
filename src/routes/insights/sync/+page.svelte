<script lang="ts">
	import { resolve } from '$app/paths';
	import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
	import { db, type Category, type Item } from '$lib/db';
	import {
		createAuthUrl,
		createDriveJsonFile,
		createPkcePair,
		downloadDriveJsonFile,
		exchangeAuthCode,
		findDriveFileByName,
		refreshAccessToken,
		updateDriveJsonFile
	} from '$lib/googleDriveClient';
	import { SvelteDate } from 'svelte/reactivity';

	type ItemSnapshot = Omit<Item, 'start_date_time_utc' | 'end_date_time_utc'>;

	type SyncSnapshot = {
		version: 1;
		exportedAt: string;
		items: ItemSnapshot[];
		categories: Category[];
	};

	const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
	const DRIVE_FILE_NAME = 'lifecycle-insights-sync.json';
	const TOKEN_KEYS = {
		accessToken: 'google_drive_access_token',
		refreshToken: 'google_drive_refresh_token',
		expiresAt: 'google_drive_expires_at',
		fileId: 'google_drive_file_id',
		codeVerifier: 'google_drive_code_verifier',
		oauthState: 'google_drive_oauth_state'
	};

	let statusMessage = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let isConnecting = $state(false);
	let isUploading = $state(false);
	let isDownloading = $state(false);
	let accessToken = $state<string | null>(null);
	let refreshToken = $state<string | null>(null);
	let accessTokenExpiresAt = $state<number | null>(null);
	let driveFileId = $state<string | null>(null);
	let initialized = false;

	const isConnected = $derived.by(() => Boolean(accessToken));
	const isBusy = $derived.by(() => isConnecting || isUploading || isDownloading);

	function getRedirectUri() {
		return new URL(resolve('/insights/sync'), window.location.origin).toString();
	}

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
		refreshToken = sessionStorage.getItem(TOKEN_KEYS.refreshToken);
		const rawExpiresAt = sessionStorage.getItem(TOKEN_KEYS.expiresAt);
		accessTokenExpiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;
		driveFileId = localStorage.getItem(TOKEN_KEYS.fileId);
	}

	function persistTokens(params: {
		accessToken: string;
		expiresAt: number;
		refreshToken?: string | null;
	}) {
		accessToken = params.accessToken;
		accessTokenExpiresAt = params.expiresAt;
		refreshToken = params.refreshToken ?? refreshToken;
		sessionStorage.setItem(TOKEN_KEYS.accessToken, accessToken);
		sessionStorage.setItem(TOKEN_KEYS.expiresAt, String(accessTokenExpiresAt));
		if (refreshToken) {
			sessionStorage.setItem(TOKEN_KEYS.refreshToken, refreshToken);
		}
	}

	function clearTokens() {
		accessToken = null;
		refreshToken = null;
		accessTokenExpiresAt = null;
		sessionStorage.removeItem(TOKEN_KEYS.accessToken);
		sessionStorage.removeItem(TOKEN_KEYS.refreshToken);
		sessionStorage.removeItem(TOKEN_KEYS.expiresAt);
	}

	function persistFileId(fileId: string) {
		driveFileId = fileId;
		localStorage.setItem(TOKEN_KEYS.fileId, fileId);
	}

	function clearFileId() {
		driveFileId = null;
		localStorage.removeItem(TOKEN_KEYS.fileId);
	}

	async function ensureAccessToken() {
		if (!accessToken) return null;

		const now = Date.now();
		if (!accessTokenExpiresAt || now < accessTokenExpiresAt - 60000) {
			return accessToken;
		}

		if (!refreshToken) {
			clearTokens();
			return null;
		}

		try {
			const refreshed = await refreshAccessToken({
				clientId: PUBLIC_GOOGLE_CLIENT_ID,
				refreshToken
			});
			persistTokens({
				accessToken: refreshed.access_token,
				expiresAt: Date.now() + refreshed.expires_in * 1000,
				refreshToken
			});
			return accessToken;
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to refresh Google token. Please reconnect.'));
			clearTokens();
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
			const { codeVerifier, codeChallenge } = await createPkcePair();
			const state = crypto.randomUUID();
			sessionStorage.setItem(TOKEN_KEYS.codeVerifier, codeVerifier);
			sessionStorage.setItem(TOKEN_KEYS.oauthState, state);

			const authUrl = createAuthUrl({
				clientId: PUBLIC_GOOGLE_CLIENT_ID,
				redirectUri: getRedirectUri(),
				scope: DRIVE_SCOPE,
				state,
				codeChallenge
			});

			window.location.assign(authUrl);
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to start Google Drive auth.'));
			isConnecting = false;
		}
	}

	function disconnectFromGoogle() {
		clearMessages();
		clearTokens();
		clearFileId();
		setStatus('Disconnected from Google Drive.');
	}

	async function handleAuthRedirect() {
		const url = new URL(window.location.href);
		const authCode = url.searchParams.get('code');
		const returnedState = url.searchParams.get('state');

		if (!authCode) return;

		const expectedState = sessionStorage.getItem(TOKEN_KEYS.oauthState);
		const codeVerifier = sessionStorage.getItem(TOKEN_KEYS.codeVerifier);

		if (!expectedState || !codeVerifier || expectedState !== returnedState) {
			setError('Google auth state mismatch. Please try connecting again.');
			return;
		}

		isConnecting = true;
		try {
			const tokenResponse = await exchangeAuthCode({
				clientId: PUBLIC_GOOGLE_CLIENT_ID,
				code: authCode,
				codeVerifier,
				redirectUri: getRedirectUri()
			});

			persistTokens({
				accessToken: tokenResponse.access_token,
				expiresAt: Date.now() + tokenResponse.expires_in * 1000,
				refreshToken: tokenResponse.refresh_token
			});
			setStatus('Google Drive connected.');
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to finalize Google Drive auth.'));
		} finally {
			isConnecting = false;
			url.searchParams.delete('code');
			url.searchParams.delete('state');
			window.history.replaceState({}, '', url.toString());
			sessionStorage.removeItem(TOKEN_KEYS.codeVerifier);
			sessionStorage.removeItem(TOKEN_KEYS.oauthState);
		}
	}

	function normalizeUtcString(value: string | null | undefined) {
		if (!value) return null;
		const trimmed = value.trim();
		if (!trimmed) return null;
		const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T') + 'Z';
		return new SvelteDate(normalized);
	}

	async function buildSnapshot(): Promise<SyncSnapshot> {
		const items = await db.items.toArray();
		const categories = await db.categories.toArray();
		const snapshotItems: ItemSnapshot[] = items.map((item) => {
			const { ...parsedItem } = item;
			return parsedItem;
		});

		return {
			version: 1,
			exportedAt: new Date().toISOString(),
			items: snapshotItems,
			categories
		};
	}

	function isValidSnapshot(data: unknown): data is SyncSnapshot {
		if (!data || typeof data !== 'object') return false;
		const payload = data as SyncSnapshot;
		return (
			payload.version === 1 && Array.isArray(payload.items) && Array.isArray(payload.categories)
		);
	}

	async function restoreSnapshot(snapshot: SyncSnapshot) {
		const parsedItems: Item[] = snapshot.items.map((item) => {
			return {
				...item,
				start_date_time_utc: normalizeUtcString(item.start_date_time_utc_string),
				end_date_time_utc: normalizeUtcString(item.end_date_time_utc_string)
			};
		});

		const categories = snapshot.categories.length
			? snapshot.categories
			: Array.from(new Set(parsedItems.map((item) => item.name))).map((name) => {
					return {
						name,
						show_in_insights: true
					};
				});

		await db.items.clear();
		await db.categories.clear();
		await db.items.bulkPut(parsedItems);
		await db.categories.bulkPut(categories);
	}

	async function resolveDriveFileId(token: string) {
		if (driveFileId) return driveFileId;
		const storedFileId = localStorage.getItem(TOKEN_KEYS.fileId);
		if (storedFileId) {
			driveFileId = storedFileId;
			return storedFileId;
		}

		const existingFile = await findDriveFileByName({ accessToken: token, name: DRIVE_FILE_NAME });
		if (existingFile?.id) {
			persistFileId(existingFile.id);
			return existingFile.id;
		}

		return null;
	}

	async function uploadSnapshotToDrive() {
		clearMessages();
		isUploading = true;
		try {
			const token = await ensureAccessToken();
			if (!token) {
				setError('Connect to Google Drive before syncing.');
				return;
			}

			const snapshot = await buildSnapshot();
			const json = JSON.stringify(snapshot, null, 2);
			let fileId = await resolveDriveFileId(token);

			if (fileId) {
				await updateDriveJsonFile({ accessToken: token, fileId, json });
				setStatus('Snapshot updated on Google Drive.');
				return;
			}

			const createdFile = await createDriveJsonFile({
				accessToken: token,
				name: DRIVE_FILE_NAME,
				json
			});
			persistFileId(createdFile.id);
			setStatus('Snapshot uploaded to Google Drive.');
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to upload snapshot.'));
		} finally {
			isUploading = false;
		}
	}

	async function downloadSnapshotFromDrive() {
		clearMessages();
		isDownloading = true;
		try {
			const token = await ensureAccessToken();
			if (!token) {
				setError('Connect to Google Drive before syncing.');
				return;
			}

			let fileId = await resolveDriveFileId(token);
			if (!fileId) {
				setError('No Google Drive snapshot found yet. Upload first.');
				return;
			}

			const json = await downloadDriveJsonFile({ accessToken: token, fileId });
			const parsed = JSON.parse(json) as unknown;

			if (!isValidSnapshot(parsed)) {
				setError('The Drive file does not look like a Life Cycle snapshot.');
				return;
			}

			await restoreSnapshot(parsed);
			setStatus('Snapshot restored from Google Drive.');
		} catch (error) {
			setError(getErrorMessage(error, 'Failed to download snapshot.'));
		} finally {
			isDownloading = false;
		}
	}

	if (typeof window !== 'undefined' && !initialized) {
		initialized = true;
		hydrateFromStorage();
		void handleAuthRedirect();
	}
</script>

<svelte:head>
	<title>Google Drive Sync | Life Cycle Insights</title>
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
			<span
				class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200"
				>Connected</span
			>
			<button
				onclick={disconnectFromGoogle}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
				disabled={isBusy}
			>
				Disconnect
			</button>
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

	<!-- <div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
			<h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Upload Snapshot</h2>
			<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
				Create or update a JSON file named {DRIVE_FILE_NAME}.
			</p>
			<button
				onclick={uploadSnapshotToDrive}
				class="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={!isConnected || isBusy}
			>
				{isUploading ? 'Uploading...' : 'Upload Snapshot'}
			</button>
		</div>
		<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
			<h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Download Snapshot</h2>
			<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
				Replace your local data with the latest Drive snapshot.
			</p>
			<button
				onclick={downloadSnapshotFromDrive}
				class="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={!isConnected || isBusy}
			>
				{isDownloading ? 'Downloading...' : 'Download Snapshot'}
			</button>
		</div>
	</div> -->

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
