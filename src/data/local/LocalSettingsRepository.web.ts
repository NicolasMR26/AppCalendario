import { DEFAULT_USER_SETTINGS, type UserSettings } from "@domain/entities/UserSettings";
import type { SettingsRepository } from "@domain/repositories/SettingsRepository";
import { getWebDb, WEB_SETTINGS_KEY } from "./db.web";

interface SettingsRecord extends UserSettings {
  id: string;
  hasSeenOnboarding?: boolean;
}

/** Singleton IndexedDB record — a browser profile only ever has one local settings record. */
export class LocalSettingsRepository implements SettingsRepository {
  async get(): Promise<UserSettings> {
    const db = await getWebDb();
    const record = (await db.get("settings", WEB_SETTINGS_KEY)) as SettingsRecord | undefined;
    if (!record) return DEFAULT_USER_SETTINGS;
    return {
      alertEmail: record.alertEmail ?? DEFAULT_USER_SETTINGS.alertEmail,
      themeMode: record.themeMode ?? DEFAULT_USER_SETTINGS.themeMode,
      reminderLeadDays: record.reminderLeadDays ?? DEFAULT_USER_SETTINGS.reminderLeadDays,
    };
  }

  async update(patch: Partial<UserSettings>): Promise<UserSettings> {
    const db = await getWebDb();
    const current = ((await db.get("settings", WEB_SETTINGS_KEY)) as SettingsRecord | undefined) ?? {
      id: WEB_SETTINGS_KEY,
      ...DEFAULT_USER_SETTINGS,
    };
    const next: SettingsRecord = { ...current, ...patch };
    await db.put("settings", next);
    return { alertEmail: next.alertEmail, themeMode: next.themeMode, reminderLeadDays: next.reminderLeadDays };
  }
}
