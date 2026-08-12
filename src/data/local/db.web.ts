import { openDB, type IDBPDatabase } from "idb";

/**
 * Web build of the local data layer: no native SQLite in the browser, so this
 * mirrors `db.ts`'s role using IndexedDB instead. Metro resolves `./db` to
 * this file automatically for web bundles (and to `db.ts` for iOS/Android),
 * so nothing else needs to branch on platform.
 */
let dbPromise: Promise<IDBPDatabase> | null = null;

export function getWebDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB("daygridkn", 1, {
      upgrade(db) {
        db.createObjectStore("subjects", { keyPath: "id" });
        const notes = db.createObjectStore("notes", { keyPath: "id" });
        notes.createIndex("by_subject", "subjectId");
        db.createObjectStore("settings", { keyPath: "id" });
        db.createObjectStore("pending_sync", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

/** Singleton key for the one-row `settings` record (theme, alert email, onboarding flag). */
export const WEB_SETTINGS_KEY = "singleton";
