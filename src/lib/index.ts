// place files you want to import through the `$lib` alias in this folder.

export function normalizeSeconds(value: number): string {
	if (value < 60) {
		return `${value}s`;
	} else if (value < 3600) {
		const minutes = Math.floor(value / 60);
		const seconds = value % 60;
		return `${minutes}m ${seconds}s`;
	} else if (value < 86400) {
		const hours = Math.floor(value / 3600);
		const minutes = Math.floor((value % 3600) / 60);
		return `${hours}h ${minutes}m`;
	} else {
		const days = Math.floor(value / 86400);
		const hours = Math.floor((value % 86400) / 3600);
		return `${days}d ${hours}h`;
	}
}

export { generateDummyData, loadDummyData } from './dummyData';
