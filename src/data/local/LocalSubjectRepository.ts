import type { NewSubject, Subject, SubjectUpdate } from "@domain/entities/Subject";
import type { SubjectRepository } from "@domain/repositories/SubjectRepository";
import { generateId } from "@presentation/utils/id";
import { getDb } from "./db";
import { subjectFromRow, type SubjectRow } from "./rowMappers";

/** SQLite-backed: the on-device source of truth every write lands in first. */
export class LocalSubjectRepository implements SubjectRepository {
  async list(): Promise<Subject[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<SubjectRow>("SELECT * FROM subjects ORDER BY day, start_time");
    return rows.map(subjectFromRow);
  }

  async get(id: string): Promise<Subject | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<SubjectRow>("SELECT * FROM subjects WHERE id = ?", id);
    return row ? subjectFromRow(row) : null;
  }

  async create(input: NewSubject): Promise<Subject> {
    const db = await getDb();
    const now = new Date().toISOString();
    const subject: Subject = { ...input, id: generateId(), createdAt: now, updatedAt: now };
    await db.runAsync(
      `INSERT INTO subjects (id, name, professor, room, color, day, start_time, end_time, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      subject.id,
      subject.name,
      subject.professor ?? null,
      subject.room ?? null,
      subject.color,
      subject.day,
      subject.startTime,
      subject.endTime,
      subject.isFavorite ? 1 : 0,
      subject.createdAt,
      subject.updatedAt
    );
    return subject;
  }

  async update(id: string, patch: SubjectUpdate): Promise<Subject> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Subject not found: ${id}`);
    const updated: Subject = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const db = await getDb();
    await db.runAsync(
      `UPDATE subjects SET name = ?, professor = ?, room = ?, color = ?, day = ?, start_time = ?, end_time = ?, is_favorite = ?, updated_at = ?
       WHERE id = ?`,
      updated.name,
      updated.professor ?? null,
      updated.room ?? null,
      updated.color,
      updated.day,
      updated.startTime,
      updated.endTime,
      updated.isFavorite ? 1 : 0,
      updated.updatedAt,
      id
    );
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM subjects WHERE id = ?", id);
  }

  /**
   * Writes a subject row exactly as given (id/timestamps included), inserting
   * or overwriting whatever is there. Used only by the sync layer to merge in
   * remote records verbatim — the UI always goes through create()/update().
   */
  async upsertRaw(subject: Subject): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO subjects (id, name, professor, room, color, day, start_time, end_time, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, professor = excluded.professor, room = excluded.room, color = excluded.color,
         day = excluded.day, start_time = excluded.start_time, end_time = excluded.end_time,
         is_favorite = excluded.is_favorite, updated_at = excluded.updated_at`,
      subject.id,
      subject.name,
      subject.professor ?? null,
      subject.room ?? null,
      subject.color,
      subject.day,
      subject.startTime,
      subject.endTime,
      subject.isFavorite ? 1 : 0,
      subject.createdAt,
      subject.updatedAt
    );
  }
}
