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
