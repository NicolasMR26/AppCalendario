export interface Note {
  id: string;
  subjectId: string;
  text: string;
  date: string | null; // ISO date "YYYY-MM-DD"; null = no due date (manual order only)
  sortOrder: number; // used when date is null / for manual ordering
  alertEmail: boolean;
  alertSentAt: string | null; // ISO timestamp once the reminder has fired, so it isn't resent
  createdAt: string;
  updatedAt: string;
}

export type NewNote = Omit<Note, "id" | "createdAt" | "updatedAt" | "alertSentAt">;
export type NoteUpdate = Partial<Omit<Note, "id" | "subjectId" | "createdAt" | "updatedAt">>;

export type NoteSortMode = "date" | "manual";

export function sortNotes(notes: Note[], mode: NoteSortMode): Note[] {
  const copy = [...notes];
  if (mode === "date") {
    return copy.sort((a, b) => {
      if (a.date === b.date) return a.sortOrder - b.sortOrder;
      if (a.date === null) return 1;
      if (b.date === null) return -1;
      return a.date.localeCompare(b.date);
    });
  }
  return copy.sort((a, b) => a.sortOrder - b.sortOrder);
}
