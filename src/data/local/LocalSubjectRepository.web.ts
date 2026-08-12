import type { NewSubject, Subject, SubjectUpdate } from "@domain/entities/Subject";
import type { SubjectRepository } from "@domain/repositories/SubjectRepository";
import { generateId } from "@presentation/utils/id";
import { getWebDb } from "./db.web";

/** IndexedDB-backed: the browser source of truth every write lands in first. */
export class LocalSubjectRepository implements SubjectRepository {
  async list(): Promise<Subject[]> {
    const db = await getWebDb();
    const all = (await db.getAll("subjects")) as Subject[];
    return all.sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
  }

  async get(id: string): Promise<Subject | null> {
    const db = await getWebDb();
    const subject = (await db.get("subjects", id)) as Subject | undefined;
    return subject ?? null;
  }

  async create(input: NewSubject): Promise<Subject> {
    const db = await getWebDb();
    const now = new Date().toISOString();
    const subject: Subject = { ...input, id: generateId(), createdAt: now, updatedAt: now };
    await db.put("subjects", subject);
    return subject;
  }

  async update(id: string, patch: SubjectUpdate): Promise<Subject> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Subject not found: ${id}`);
    const updated: Subject = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const db = await getWebDb();
    await db.put("subjects", updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getWebDb();
    await db.delete("subjects", id);
    // No foreign keys in IndexedDB: cascade-delete this subject's notes ourselves.
    const tx = db.transaction("notes", "readwrite");
    const index = tx.store.index("by_subject");
    let cursor = await index.openCursor(IDBKeyRange.only(id));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
