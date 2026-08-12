import { getWebDb } from "@data/local/db.web";

type PendingOp =
  | { kind: "subject-upsert"; id: string }
  | { kind: "subject-delete"; id: string }
  | { kind: "note-upsert"; id: string }
  | { kind: "note-delete"; id: string };

type PendingSyncRecord = PendingOp & { key: string };

function keyFor(op: PendingOp): string {
  return `${op.kind}:${op.id}`;
}

/** Same role as the native `SyncQueue`, backed by IndexedDB instead of SQLite. */
export class SyncQueue {
  async enqueue(op: PendingOp): Promise<void> {
    const db = await getWebDb();
    await db.put("pending_sync", { ...op, key: keyFor(op) } satisfies PendingSyncRecord);
  }

  async all(): Promise<PendingOp[]> {
    const db = await getWebDb();
    const records = (await db.getAll("pending_sync")) as PendingSyncRecord[];
    return records.map(({ key, ...op }) => op as PendingOp);
  }

  async clear(): Promise<void> {
    const db = await getWebDb();
    await db.clear("pending_sync");
  }

  async remove(op: PendingOp): Promise<void> {
    const db = await getWebDb();
    await db.delete("pending_sync", keyFor(op));
  }
}

export type { PendingOp };
