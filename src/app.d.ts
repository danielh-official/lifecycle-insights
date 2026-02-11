// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare global {
	interface Window {
		google?: {
			accounts?: {
				oauth2?: {
					initTokenClient: (options: {
						client_id: string;
						scope: string;
						callback: (response: TokenClientResponse) => void;
					}) => TokenClient;
				};
			};
		};
	}
}

export {};
