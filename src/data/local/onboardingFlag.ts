import { getDb } from "./db";

/**
 * Whether the first-launch walkthrough has been shown on THIS device.
 * Deliberately kept out of `UserSettings`/`SettingsRepository`: it must
 * never be pulled from Supabase on sign-in, or a fresh install on a new
 * device would skip the walkthrough because another device already saw it.
 */
export async function getHasSeenOnboarding(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ has_seen_onboarding: number }>(
    "SELECT has_seen_onboarding FROM settings WHERE id = 1"
  );
  return row?.has_seen_onboarding === 1;
}

export async function setHasSeenOnboarding(value: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE settings SET has_seen_onboarding = ? WHERE id = 1", value ? 1 : 0);
}
