import type { Note } from "@domain/entities/Note";
import type { Subject } from "@domain/entities/Subject";

/** Supabase rows are snake_case; domain entities are camelCase. Keep the boundary here only. */

export interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  professor: string | null;
  room: string | null;
  color: string;
  day: number;
  start_time: string;
  end_time: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteRow {
  id: string;
  subject_id: string;
  text: string;
  date: string | null;
  sort_order: number;
  alert_email: boolean;
  alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function subjectFromRow(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    professor: row.professor ?? undefined,
    room: row.room ?? undefined,
    color: row.color,
    day: row.day as Subject["day"],
    startTime: row.start_time,
    endTime: row.end_time,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function subjectToRow(subject: Subject, userId: string): SubjectRow {
  return {
    id: subject.id,
    user_id: userId,
    name: subject.name,
    professor: subject.professor ?? null,
    room: subject.room ?? null,
    color: subject.color,
    day: subject.day,
    start_time: subject.startTime,
    end_time: subject.endTime,
    is_favorite: subject.isFavorite,
    created_at: subject.createdAt,
    updated_at: subject.updatedAt,
  };
}

export function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id,
    subjectId: row.subject_id,
    text: row.text,
    date: row.date,
    sortOrder: row.sort_order,
    alertEmail: row.alert_email,
    alertSentAt: row.alert_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function noteToRow(note: Note): NoteRow {
  return {
    id: note.id,
    subject_id: note.subjectId,
    text: note.text,
    date: note.date,
    sort_order: note.sortOrder,
    alert_email: note.alertEmail,
    alert_sent_at: note.alertSentAt,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}
