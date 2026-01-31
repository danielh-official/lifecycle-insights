// db.ts
import { Dexie, type EntityTable } from "dexie"

interface Item {
    id: number;
    start_date_time_utc_string: string;
    end_date_time_utc_string: string;
    duration: number;
    name: string;
    location: string | null;
    note: string | null;
    start_date_time_utc?: Date | null;
    end_date_time_utc?: Date | null;
}

const db = new Dexie("LifecycleInsightsDB") as Dexie & {
    items: EntityTable<
        Item,
        "id" // primary key "id" (for the typings only)
    >
}

// Schema declaration:
db.version(1).stores({
    items: "++id, name, location", // primary key "id" (for the runtime!)
})

export type { Item }
export { db }
