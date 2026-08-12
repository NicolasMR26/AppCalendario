import type { Note } from "@domain/entities/Note";
import type { Subject } from "@domain/entities/Subject";

/** SQLite rows are snake_case with 0/1 booleans; domain entities are camelCase. */

export interface SubjectRow {
  id: string;
  name: string;
  professor: string | null;
  color: string;
  day: number;
  start_time: string;
  end_time: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

export interface NoteRow {
  id: string;
  subject_id: string;
  text: string;
  date: string | null;
  sort_order: number;
  alert_email: number;
  alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function subjectFromRow(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    professor: row.professor ?? undefined,
    color: row.color,
    day: row.day as Subject["day"],
    startTime: row.start_time,
    endTime: row.end_time,
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id,
    subjectId: row.subject_id,
    text: row.text,
    date: row.date,
    sortOrder: row.sort_order,
    alertEmail: row.alert_email === 1,
    alertSentAt: row.alert_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
