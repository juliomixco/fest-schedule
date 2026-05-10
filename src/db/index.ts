import Dexie, { type Table } from "dexie";
import type { Festival } from "../types";

interface SelectionRecord {
  id: string; // festivalId
  actIds: string[];
}

interface ThumbnailRecord {
  actId: string;
  url: string;
  fetchedAt: number;
}

class FestScheduleDB extends Dexie {
  festivals!: Table<Festival, string>;
  selections!: Table<SelectionRecord, string>;
  thumbnails!: Table<ThumbnailRecord, string>;

  constructor() {
    super("FestScheduleDB");
    this.version(1).stores({
      festivals: "id, name",
      selections: "id",
      thumbnails: "actId, fetchedAt",
    });
  }
}

export const db = new FestScheduleDB();

// --- Festival helpers ---
export const getFestivals = () => db.festivals.toArray();
export const getFestival = (id: string) => db.festivals.get(id);
export const saveFestival = (festival: Festival) => db.festivals.put(festival);
export const deleteFestival = (id: string) => db.festivals.delete(id);

// --- Selection helpers ---
export async function getSelections(festivalId: string): Promise<Set<string>> {
  const record = await db.selections.get(festivalId);
  return new Set(record?.actIds ?? []);
}

export async function saveSelections(
  festivalId: string,
  actIds: Set<string>,
): Promise<void> {
  await db.selections.put({ id: festivalId, actIds: [...actIds] });
}

// --- Thumbnail helpers ---
export async function getCachedThumbnail(
  actId: string,
): Promise<string | undefined> {
  const record = await db.thumbnails.get(actId);
  return record?.url;
}

export async function cacheThumbnail(
  actId: string,
  url: string,
): Promise<void> {
  await db.thumbnails.put({ actId, url, fetchedAt: Date.now() });
}
