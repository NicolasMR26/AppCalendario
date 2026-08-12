import type { NewNote, Note, NoteUpdate } from "@domain/entities/Note";

export interface NoteRepository {
  listBySubject(subjectId: string): Promise<Note[]>;
  listAll(): Promise<Note[]>;
  create(input: NewNote): Promise<Note>;
  update(id: string, patch: NoteUpdate): Promise<Note>;
  remove(id: string): Promise<void>;
  reorder(subjectId: string, orderedIds: string[]): Promise<void>;
}
