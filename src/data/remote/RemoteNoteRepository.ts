import type { NewNote, Note, NoteUpdate } from "@domain/entities/Note";
import type { NoteRepository } from "@domain/repositories/NoteRepository";
import { generateId } from "@presentation/utils/id";
import { noteFromRow, noteToRow, type NoteRow } from "./mappers";
import { supabase } from "./supabaseClient";

/** Talks to the `notes` table. Used by the sync layer, never directly by the UI. */
export class RemoteNoteRepository implements NoteRepository {
  async listBySubject(subjectId: string): Promise<Note[]> {
    const { data, error } = await supabase.from("notes").select("*").eq("subject_id", subjectId).order("sort_order");
    if (error) throw error;
    return (data as NoteRow[]).map(noteFromRow);
  }

  async listAll(): Promise<Note[]> {
    const { data, error } = await supabase.from("notes").select("*").order("date");
    if (error) throw error;
    return (data as NoteRow[]).map(noteFromRow);
  }

  async create(input: NewNote): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = { ...input, id: generateId(), alertSentAt: null, createdAt: now, updatedAt: now };
    const { error } = await supabase.from("notes").insert(noteToRow(note));
    if (error) throw error;
    return note;
  }

  async update(id: string, patch: NoteUpdate): Promise<Note> {
    const { data: existingRow, error: fetchError } = await supabase.from("notes").select("*").eq("id", id).single();
    if (fetchError) throw fetchError;
    const updated: Note = { ...noteFromRow(existingRow as NoteRow), ...patch, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from("notes").update(noteToRow(updated)).eq("id", id);
    if (error) throw error;
    return updated;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) throw error;
  }

  async reorder(subjectId: string, orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) => supabase.from("notes").update({ sort_order: index }).eq("id", id).eq("subject_id", subjectId))
    );
  }

  /** Upsert used by the sync layer to push a locally-created/updated row as-is. */
  async upsert(note: Note): Promise<void> {
    const { error } = await supabase.from("notes").upsert(noteToRow(note));
    if (error) throw error;
  }
}
