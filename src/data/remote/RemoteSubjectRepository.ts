import type { NewSubject, Subject, SubjectUpdate } from "@domain/entities/Subject";
import type { SubjectRepository } from "@domain/repositories/SubjectRepository";
import { generateId } from "@presentation/utils/id";
import { subjectFromRow, subjectToRow, type SubjectRow } from "./mappers";
import { supabase } from "./supabaseClient";

/** Talks to the `subjects` table. Used by the sync layer, never directly by the UI. */
export class RemoteSubjectRepository implements SubjectRepository {
  private async userId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Not authenticated");
    return data.user.id;
  }

  async list(): Promise<Subject[]> {
    const { data, error } = await supabase.from("subjects").select("*").order("day").order("start_time");
    if (error) throw error;
    return (data as SubjectRow[]).map(subjectFromRow);
  }

  async get(id: string): Promise<Subject | null> {
    const { data, error } = await supabase.from("subjects").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? subjectFromRow(data as SubjectRow) : null;
  }

  async create(input: NewSubject): Promise<Subject> {
    const userId = await this.userId();
    const now = new Date().toISOString();
    const subject: Subject = { ...input, id: generateId(), createdAt: now, updatedAt: now };
    const { error } = await supabase.from("subjects").insert(subjectToRow(subject, userId));
    if (error) throw error;
    return subject;
  }

  async update(id: string, patch: SubjectUpdate): Promise<Subject> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Subject not found: ${id}`);
    const userId = await this.userId();
    const updated: Subject = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from("subjects").update(subjectToRow(updated, userId)).eq("id", id);
    if (error) throw error;
    return updated;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) throw error;
  }

  /** Upsert used by the sync layer to push a locally-created/updated row as-is. */
  async upsert(subject: Subject): Promise<void> {
    const userId = await this.userId();
    const { error } = await supabase.from("subjects").upsert(subjectToRow(subject, userId));
    if (error) throw error;
  }
}
