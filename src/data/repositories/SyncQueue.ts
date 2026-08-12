import { getDb } from "@data/local/db";

type PendingOp =
  | { kind: "subject-upsert"; id: string }
  | { kind: "subject-delete"; id: string }
  | { kind: "note-upsert"; id: string }
  | { kind: "note-delete"; id: string };

interface PendingSyncRow {
  kind: string;
  ref_id: string;
}

/**
 * Minimal persisted retry queue for the offline-first sync layer, stored in
 * the local SQLite database. Reads/writes always succeed locally first; if
 * the Supabase push fails (offline, transient error) the operation lands
 * here and is retried on the next flush.
 */
export class SyncQueue {
  async enqueue(op: PendingOp): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO pending_sync (kind, ref_id) VALUES (?, ?)",
      op.kind,
      op.id
    );
  }

  async all(): Promise<PendingOp[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<PendingSyncRow>("SELECT kind, ref_id FROM pending_sync");
    return rows.map((row) => ({ kind: row.kind, id: row.ref_id }) as PendingOp);
  }

  async clear(): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM pending_sync");
  }

  async remove(op: PendingOp): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM pending_sync WHERE kind = ? AND ref_id = ?", op.kind, op.id);
  }
}

export type { PendingOp };
