import * as SQLite from "expo-sqlite";

/**
 * The on-device database — the single source of truth for reads. Supabase
 * (when signed in) is a background mirror, never required for the app to work.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("daygridkn.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      professor TEXT,
      color TEXT NOT NULL,
      day INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      date TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      alert_email INTEGER NOT NULL DEFAULT 0,
      alert_sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notes_subject_id_idx ON notes(subject_id);

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      alert_email TEXT,
      theme_mode TEXT NOT NULL DEFAULT 'system',
      reminder_lead_days INTEGER NOT NULL DEFAULT 2
    );
    INSERT OR IGNORE INTO settings (id, alert_email, theme_mode, reminder_lead_days)
      VALUES (1, NULL, 'system', 2);

    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      ref_id TEXT NOT NULL,
      UNIQUE(kind, ref_id)
    );
  `);

  await addColumnIfMissing(db, "settings", "has_seen_onboarding", "INTEGER NOT NULL DEFAULT 0");

  return db;
}

/** `CREATE TABLE IF NOT EXISTS` doesn't retroactively add columns to an existing table — this does. */
async function addColumnIfMissing(db: SQLite.SQLiteDatabase, table: string, column: string, definition: string): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
