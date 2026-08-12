import type { NewNote, Note, NoteUpdate } from "@domain/entities/Note";
import type { NoteRepository } from "@domain/repositories/NoteRepository";
import { generateId } from "@presentation/utils/id";
import { getWebDb } from "./db.web";

export class LocalNoteRepository implements NoteRepository {
  async listBySubject(subjectId: string): Promise<Note[]> {
    const db = await getWebDb();
    const notes = (await db.getAllFromIndex("notes", "by_subject", subjectId)) as Note[];
    return notes.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** Every note across every subject, for the aggregate Notas/Eventos screens. */
  async listAll(): Promise<Note[]> {
    const db = await getWebDb();
    const notes = (await db.getAll("notes")) as Note[];
    return notes.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }

  /** Used by the sync layer to resolve a single note by id. */
  async getById(id: string): Promise<Note | null> {
    const db = await getWebDb();
    const note = (await db.get("notes", id)) as Note | undefined;
    return note ?? null;
  }

  async create(input: NewNote): Promise<Note> {
    const db = await getWebDb();
    const now = new Date().toISOString();
    const note: Note = { ...input, id: generateId(), alertSentAt: null, createdAt: now, updatedAt: now };
    await db.put("notes", note);
    return note;
  }

  async update(id: string, patch: NoteUpdate): Promise<Note> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Note not found: ${id}`);
    const updated: Note = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const db = await getWebDb();
    await db.put("notes", updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getWebDb();
    await db.delete("notes", id);
  }

  async reorder(subjectId: string, orderedIds: string[]): Promise<void> {
    const db = await getWebDb();
    const tx = db.transaction("notes", "readwrite");
    const now = new Date().toISOString();
    for (let index = 0; index < orderedIds.length; index++) {
      const note = (await tx.store.get(orderedIds[index])) as Note | undefined;
      if (note && note.subjectId === subjectId) {
        await tx.store.put({ ...note, sortOrder: index, updatedAt: now });
      }
    }
    await tx.done;
  }
}
