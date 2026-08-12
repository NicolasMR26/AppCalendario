import { DEFAULT_USER_SETTINGS, type UserSettings } from "@domain/entities/UserSettings";
import type { SettingsRepository } from "@domain/repositories/SettingsRepository";
import { getDb } from "./db";

interface SettingsRow {
  alert_email: string | null;
  theme_mode: UserSettings["themeMode"];
  reminder_lead_days: number;
}

/** Singleton row (id = 1) — a device only ever has one local settings record. */
export class LocalSettingsRepository implements SettingsRepository {
  async get(): Promise<UserSettings> {
    const db = await getDb();
    const row = await db.getFirstAsync<SettingsRow>(
      "SELECT alert_email, theme_mode, reminder_lead_days FROM settings WHERE id = 1"
    );
    if (!row) return DEFAULT_USER_SETTINGS;
    return { alertEmail: row.alert_email, themeMode: row.theme_mode, reminderLeadDays: row.reminder_lead_days };
  }

  async update(patch: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.get();
    const next = { ...current, ...patch };
    const db = await getDb();
    await db.runAsync(
      "UPDATE settings SET alert_email = ?, theme_mode = ?, reminder_lead_days = ? WHERE id = 1",
      next.alertEmail,
      next.themeMode,
      next.reminderLeadDays
    );
    return next;
  }
}
