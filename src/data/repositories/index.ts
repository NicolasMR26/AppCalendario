import { SyncNoteRepository } from "./SyncNoteRepository";
import { SyncSettingsRepository } from "./SyncSettingsRepository";
import { SyncSubjectRepository } from "./SyncSubjectRepository";

/**
 * Composition root: the rest of the app (store, screens) depends only on the
 * `@domain/repositories` interfaces, never on these concrete classes.
 */
export const subjectRepository = new SyncSubjectRepository();
export const noteRepository = new SyncNoteRepository();
export const settingsRepository = new SyncSettingsRepository();

/** Call on app start and whenever connectivity/auth state changes. */
export async function flushPendingSync(): Promise<void> {
  await Promise.all([subjectRepository.flushPending(), noteRepository.flushPending()]);
}

/**
 * Downloads the remote mirror into the local store on sign-in, so a second
 * device (or a reinstall under the same account) actually sees subjects/notes
 * synced elsewhere instead of starting from an empty local database. Subjects
 * must be pulled before notes: a note's `subject_id` foreign key requires its
 * parent subject to already exist locally.
 */
export async function pullRemoteData(): Promise<void> {
  await subjectRepository.pullFromRemote();
  await noteRepository.pullFromRemote();
}
