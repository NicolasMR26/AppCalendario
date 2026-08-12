import type { NewSubject, Subject, SubjectUpdate } from "@domain/entities/Subject";

/** Port implemented by data-layer adapters (local cache, Supabase, ...). */
export interface SubjectRepository {
  list(): Promise<Subject[]>;
  get(id: string): Promise<Subject | null>;
  create(input: NewSubject): Promise<Subject>;
  update(id: string, patch: SubjectUpdate): Promise<Subject>;
  remove(id: string): Promise<void>;
}
