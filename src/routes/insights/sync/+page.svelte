<script lang="ts">
	import { resolve } from '$app/paths';
	import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

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

        console.log('Updated drive file path:', driveFilePath);
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
							class="ml-2 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-full"
							value={driveFilePath}
							oninput={onDriveFilePathUpdate}
						/>
						<p class="text-xs text-gray-500 dark:text-gray-400">Leave empty for root directory</p>
					</div>
					<button
						class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
						>Sync Data to Google Drive</button
					>

					<button
						class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
						>Sync Data from Google Drive</button
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
