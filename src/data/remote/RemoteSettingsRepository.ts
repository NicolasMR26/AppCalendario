import { DEFAULT_USER_SETTINGS, type UserSettings } from "@domain/entities/UserSettings";
import { supabase } from "./supabaseClient";

interface UserSettingsRow {
  user_id: string;
  alert_email: string | null;
  theme_mode: UserSettings["themeMode"];
  reminder_lead_days: number;
}

/** Talks to the `user_settings` table the Edge Functions read alert_email / reminder_lead_days from. */
export class RemoteSettingsRepository {
  private async userId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  async get(): Promise<UserSettings | null> {
    const userId = await this.userId();
    if (!userId) return null;
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as UserSettingsRow;
    return { alertEmail: row.alert_email, themeMode: row.theme_mode, reminderLeadDays: row.reminder_lead_days };
  }

  async upsert(settings: UserSettings): Promise<void> {
    const userId = await this.userId();
    if (!userId) return;
    const row: UserSettingsRow = {
      user_id: userId,
      alert_email: settings.alertEmail ?? DEFAULT_USER_SETTINGS.alertEmail,
      theme_mode: settings.themeMode,
      reminder_lead_days: settings.reminderLeadDays,
    };
    const { error } = await supabase.from("user_settings").upsert(row);
    if (error) throw error;
  }
}
