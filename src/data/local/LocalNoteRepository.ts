import type { NewNote, Note, NoteUpdate } from "@domain/entities/Note";
import type { NoteRepository } from "@domain/repositories/NoteRepository";
import { generateId } from "@presentation/utils/id";
import { getDb } from "./db";
import { noteFromRow, type NoteRow } from "./rowMappers";

export class LocalNoteRepository implements NoteRepository {
  async listBySubject(subjectId: string): Promise<Note[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<NoteRow>(
      "SELECT * FROM notes WHERE subject_id = ? ORDER BY sort_order",
      subjectId
    );
    return rows.map(noteFromRow);
  }

  /** Every note across every subject, for the aggregate Notas/Eventos screens. */
  async listAll(): Promise<Note[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<NoteRow>("SELECT * FROM notes ORDER BY date");
    return rows.map(noteFromRow);
  }

  /** Used by the sync layer to resolve a single note by id. */
  async getById(id: string): Promise<Note | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<NoteRow>("SELECT * FROM notes WHERE id = ?", id);
    return row ? noteFromRow(row) : null;
  }

  async create(input: NewNote): Promise<Note> {
    const db = await getDb();
    const now = new Date().toISOString();
    const note: Note = { ...input, id: generateId(), alertSentAt: null, createdAt: now, updatedAt: now };
    await db.runAsync(
      `INSERT INTO notes (id, subject_id, text, date, sort_order, alert_email, alert_sent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      note.id,
      note.subjectId,
      note.text,
      note.date,
      note.sortOrder,
      note.alertEmail ? 1 : 0,
      note.alertSentAt,
      note.createdAt,
      note.updatedAt
    );
    return note;
  }

  async update(id: string, patch: NoteUpdate): Promise<Note> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Note not found: ${id}`);
    const updated: Note = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const db = await getDb();
    await db.runAsync(
      `UPDATE notes SET text = ?, date = ?, sort_order = ?, alert_email = ?, alert_sent_at = ?, updated_at = ?
       WHERE id = ?`,
      updated.text,
      updated.date,
      updated.sortOrder,
      updated.alertEmail ? 1 : 0,
      updated.alertSentAt,
      updated.updatedAt,
      id
    );
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM notes WHERE id = ?", id);
  }

  /**
   * Writes a note row exactly as given (id/timestamps included), inserting or
   * overwriting whatever is there. Used only by the sync layer to merge in
   * remote records verbatim — the UI always goes through create()/update().
   */
  async upsertRaw(note: Note): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO notes (id, subject_id, text, date, sort_order, alert_email, alert_sent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         text = excluded.text, date = excluded.date, sort_order = excluded.sort_order,
         alert_email = excluded.alert_email, alert_sent_at = excluded.alert_sent_at, updated_at = excluded.updated_at`,
      note.id,
      note.subjectId,
      note.text,
      note.date,
      note.sortOrder,
      note.alertEmail ? 1 : 0,
      note.alertSentAt,
      note.createdAt,
      note.updatedAt
    );
  }

  async reorder(subjectId: string, orderedIds: string[]): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      for (let index = 0; index < orderedIds.length; index++) {
        await db.runAsync(
          "UPDATE notes SET sort_order = ?, updated_at = ? WHERE id = ? AND subject_id = ?",
          index,
          now,
          orderedIds[index],
          subjectId
        );
      }
    });
  }
}
