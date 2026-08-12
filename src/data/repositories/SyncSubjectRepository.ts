import type { NewSubject, Subject, SubjectUpdate } from "@domain/entities/Subject";
import type { SubjectRepository } from "@domain/repositories/SubjectRepository";
import { LocalSubjectRepository } from "@data/local/LocalSubjectRepository";
import { RemoteSubjectRepository } from "@data/remote/RemoteSubjectRepository";
import { isSupabaseConfigured, supabase } from "@data/remote/supabaseClient";
import { SyncQueue } from "./SyncQueue";

/**
 * Offline-first facade: the local store is the source of truth for reads.
 * Writes land locally (instant, always works), then get pushed to Supabase;
 * failures are queued and retried by `flushPendingSync`.
 */
export class SyncSubjectRepository implements SubjectRepository {
  private local = new LocalSubjectRepository();
  private remote = new RemoteSubjectRepository();
  private queue = new SyncQueue();

  private async isOnline(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }

  list(): Promise<Subject[]> {
    return this.local.list();
  }

  get(id: string): Promise<Subject | null> {
    return this.local.get(id);
  }

  async create(input: NewSubject): Promise<Subject> {
    const subject = await this.local.create(input);
    void this.pushUpsert(subject);
    return subject;
  }

  async update(id: string, patch: SubjectUpdate): Promise<Subject> {
    const subject = await this.local.update(id, patch);
    void this.pushUpsert(subject);
    return subject;
  }

  async remove(id: string): Promise<void> {
    await this.local.remove(id);
    if (!(await this.isOnline())) {
      await this.queue.enqueue({ kind: "subject-delete", id });
      return;
    }
    try {
      await this.remote.remove(id);
    } catch {
      await this.queue.enqueue({ kind: "subject-delete", id });
    }
  }

  private async pushUpsert(subject: Subject): Promise<void> {
    if (!(await this.isOnline())) {
      await this.queue.enqueue({ kind: "subject-upsert", id: subject.id });
      return;
    }
    try {
      await this.remote.upsert(subject);
    } catch {
      await this.queue.enqueue({ kind: "subject-upsert", id: subject.id });
    }
  }

  /** Retries every queued subject operation; called on app start / reconnect. */
  async flushPending(): Promise<void> {
    if (!(await this.isOnline())) return;
    const pending = await this.queue.all();
    for (const op of pending) {
      if (op.kind !== "subject-upsert" && op.kind !== "subject-delete") continue;
      try {
        if (op.kind === "subject-upsert") {
          const subject = await this.local.get(op.id);
          if (subject) await this.remote.upsert(subject);
        } else {
          await this.remote.remove(op.id);
        }
        await this.queue.remove(op);
      } catch {
        // leave in queue, retry next flush
      }
    }
  }
}
