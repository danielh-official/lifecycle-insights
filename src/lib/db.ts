// db.ts
import { Dexie, type EntityTable } from 'dexie';
import { SvelteDate } from 'svelte/reactivity';

interface Item {
	id: string;
	start_date_time_utc_string: string;
	end_date_time_utc_string: string;
	duration: number;
	name: string;
	location: string | null;
	note: string | null;
	start_date_time_utc?: SvelteDate | null;
	end_date_time_utc?: SvelteDate | null;
}

interface Category {
    name: string;
    color: string;
}

const db = new Dexie('LifecycleInsightsDB') as Dexie & {
	items: EntityTable<Item, 'id'>;
	categories: EntityTable<Category, 'name'>;
};

// Schema declaration:
db.version(2).stores({
	items: 'id, name, location',
	categories: 'name'
});

export type { Item, Category };
export { db };
