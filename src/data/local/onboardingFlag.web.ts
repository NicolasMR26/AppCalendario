import { getWebDb, WEB_SETTINGS_KEY } from "./db.web";

/**
 * Whether the first-launch walkthrough has been shown in THIS browser.
 * Stored alongside the settings record but never read/written by
 * `LocalSettingsRepository`, so it's never pulled from Supabase on sign-in.
 */
export async function getHasSeenOnboarding(): Promise<boolean> {
  const db = await getWebDb();
  const record = await db.get("settings", WEB_SETTINGS_KEY);
  return record?.hasSeenOnboarding === true;
}

export async function setHasSeenOnboarding(value: boolean): Promise<void> {
  const db = await getWebDb();
  const current = (await db.get("settings", WEB_SETTINGS_KEY)) ?? { id: WEB_SETTINGS_KEY };
  await db.put("settings", { ...current, hasSeenOnboarding: value });
}
