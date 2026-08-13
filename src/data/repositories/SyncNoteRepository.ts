import type { NewNote, Note, NoteUpdate } from "@domain/entities/Note";
import type { NoteRepository } from "@domain/repositories/NoteRepository";
import { LocalNoteRepository } from "@data/local/LocalNoteRepository";
import { RemoteNoteRepository } from "@data/remote/RemoteNoteRepository";
import { isSupabaseConfigured, supabase } from "@data/remote/supabaseClient";
import { SyncQueue } from "./SyncQueue";

/** Same offline-first pattern as {@link SyncSubjectRepository}, for notes. */
export class SyncNoteRepository implements NoteRepository {
  private local = new LocalNoteRepository();
  private remote = new RemoteNoteRepository();
  private queue = new SyncQueue();

  private async isOnline(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }

  listBySubject(subjectId: string): Promise<Note[]> {
    return this.local.listBySubject(subjectId);
  }

  listAll(): Promise<Note[]> {
    return this.local.listAll();
  }

  async create(input: NewNote): Promise<Note> {
    const note = await this.local.create(input);
    void this.pushUpsert(note);
    return note;
  }

  async update(id: string, patch: NoteUpdate): Promise<Note> {
    const note = await this.local.update(id, patch);
    void this.pushUpsert(note);
    return note;
  }

  async remove(id: string): Promise<void> {
    await this.local.remove(id);
    if (!(await this.isOnline())) {
      await this.queue.enqueue({ kind: "note-delete", id });
      return;
    }
    try {
      await this.remote.remove(id);
    } catch {
      await this.queue.enqueue({ kind: "note-delete", id });
    }
  }

  async reorder(subjectId: string, orderedIds: string[]): Promise<void> {
    await this.local.reorder(subjectId, orderedIds);
    if (await this.isOnline()) {
      try {
        await this.remote.reorder(subjectId, orderedIds);
        return;
      } catch {
        // fall through to per-note queueing below
      }
    }
    for (const id of orderedIds) {
      await this.queue.enqueue({ kind: "note-upsert", id });
    }
  }

  private async pushUpsert(note: Note): Promise<void> {
    if (!(await this.isOnline())) {
      await this.queue.enqueue({ kind: "note-upsert", id: note.id });
      return;
    }
    try {
      await this.remote.upsert(note);
    } catch {
      await this.queue.enqueue({ kind: "note-upsert", id: note.id });
    }
  }

  /**
   * Pulls the remote mirror down into the local store, merging by `updatedAt`
   * so a newer local edit (not yet pushed) is never clobbered by an older
   * remote row. Must run after {@link SyncSubjectRepository.pullFromRemote}
   * so each note's parent subject already exists locally (FK constraint).
   * Called on sign-in / app start.
   */
  async pullFromRemote(): Promise<void> {
    if (!(await this.isOnline())) return;
    try {
      const [remoteNotes, localNotes] = await Promise.all([this.remote.listAll(), this.local.listAll()]);
      const localById = new Map(localNotes.map((n) => [n.id, n]));
      for (const remoteNote of remoteNotes) {
        const localNote = localById.get(remoteNote.id);
        if (!localNote || remoteNote.updatedAt > localNote.updatedAt) {
          await this.local.upsertRaw(remoteNote);
        }
      }
    } catch {
      // best-effort; local stays authoritative, retried on next pull
    }
  }

  /** Retries every queued note operation; called on app start / reconnect. */
  async flushPending(): Promise<void> {
    if (!(await this.isOnline())) return;
    const pending = await this.queue.all();
    for (const op of pending) {
      if (op.kind !== "note-upsert" && op.kind !== "note-delete") continue;
      try {
        if (op.kind === "note-upsert") {
          const note = await this.local.getById(op.id);
          if (note) await this.remote.upsert(note);
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
