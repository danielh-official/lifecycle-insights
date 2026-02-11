type DriveFile = {
	id: string;
	name: string;
	modifiedTime?: string;
	size?: string;
};

type DriveListResponse = {
	files: DriveFile[];
};

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

const CODE_VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

function randomString(length: number) {
	const values = new Uint8Array(length);
	crypto.getRandomValues(values);
	let result = '';

	for (const value of values) {
		result += CODE_VERIFIER_CHARS[value % CODE_VERIFIER_CHARS.length];
	}

	return result;
}

function formatError(prefix: string, payload: unknown) {
	if (typeof payload === 'string') {
		return `${prefix}: ${payload}`;
	}

	if (payload && typeof payload === 'object' && 'error' in payload) {
		const error = payload.error as { message?: string };
		if (error?.message) {
			return `${prefix}: ${error.message}`;
		}
	}

	return prefix;
}

async function getErrorMessage(response: Response, prefix: string) {
	let text = '';

	try {
		text = await response.text();
	} catch {
		return prefix;
	}

	if (!text) return prefix;

	try {
		const payload = JSON.parse(text);
		return formatError(prefix, payload);
	} catch {
		return formatError(prefix, text);
	}
}

export async function findDriveFileByName(options: { accessToken: string; name: string }) {
	const url = new URL(DRIVE_FILES_ENDPOINT);
	url.searchParams.set('q', `name='${options.name.replace(/'/g, "\\'")}' and trashed=false`);
	url.searchParams.set('fields', 'files(id,name,modifiedTime,size)');
	url.searchParams.set('pageSize', '1');

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${options.accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response, 'Failed to find Drive file'));
	}

	const payload = (await response.json()) as DriveListResponse;
	return payload.files[0] ?? null;
}

export async function createDriveJsonFile(options: {
	accessToken: string;
	name: string;
	json: string;
}) {
	const boundary = `lifecycleinsights-${randomString(12)}`;
	const metadata = {
		name: options.name,
		mimeType: 'application/json'
	};
	const body =
		`--${boundary}\r\n` +
		`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
		`${JSON.stringify(metadata)}\r\n` +
		`--${boundary}\r\n` +
		`Content-Type: application/json\r\n\r\n` +
		`${options.json}\r\n` +
		`--${boundary}--`;

	const url = new URL(DRIVE_UPLOAD_ENDPOINT);
	url.searchParams.set('uploadType', 'multipart');
	url.searchParams.set('fields', 'id,name,modifiedTime');

	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${options.accessToken}`,
			'Content-Type': `multipart/related; boundary=${boundary}`
		},
		body
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response, 'Failed to create Drive file'));
	}

	return (await response.json()) as DriveFile;
}

export async function updateDriveJsonFile(options: {
	accessToken: string;
	fileId: string;
	json: string;
}) {
	const url = new URL(`${DRIVE_UPLOAD_ENDPOINT}/${options.fileId}`);
	url.searchParams.set('uploadType', 'media');
	url.searchParams.set('fields', 'id,name,modifiedTime');

	const response = await fetch(url.toString(), {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${options.accessToken}`,
			'Content-Type': 'application/json'
		},
		body: options.json
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response, 'Failed to update Drive file'));
	}

	return (await response.json()) as DriveFile;
}

export async function downloadDriveJsonFile(options: { accessToken: string; fileId: string }) {
	const url = new URL(`${DRIVE_FILES_ENDPOINT}/${options.fileId}`);
	url.searchParams.set('alt', 'media');

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${options.accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response, 'Failed to download Drive file'));
	}

	return response.text();
}
