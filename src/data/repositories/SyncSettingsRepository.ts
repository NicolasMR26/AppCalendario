import type { UserSettings } from "@domain/entities/UserSettings";
import type { SettingsRepository } from "@domain/repositories/SettingsRepository";
import { LocalSettingsRepository } from "@data/local/LocalSettingsRepository";
import { RemoteSettingsRepository } from "@data/remote/RemoteSettingsRepository";
import { isSupabaseConfigured, supabase } from "@data/remote/supabaseClient";

/**
 * Local is always the source of truth for reads (works fully offline / signed out).
 * When signed in, remote is pulled once on `get()` — cheap and keeps the two
 * devices roughly in sync without a realtime subscription — and every write
 * is pushed to `user_settings` so the Edge Functions can read alert_email /
 * reminder_lead_days.
 */
export class SyncSettingsRepository implements SettingsRepository {
  private local = new LocalSettingsRepository();
  private remote = new RemoteSettingsRepository();

  private async isOnline(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }

  async get(): Promise<UserSettings> {
    if (await this.isOnline()) {
      try {
        const remote = await this.remote.get();
        if (remote) {
          await this.local.update(remote);
          return remote;
        }
      } catch {
        // fall back to local below
      }
    }
    return this.local.get();
  }

  async update(patch: Partial<UserSettings>): Promise<UserSettings> {
    const updated = await this.local.update(patch);
    if (await this.isOnline()) {
      this.remote.upsert(updated).catch(() => {
        // best-effort; next `get()` while online will reconcile
      });
    }
    return updated;
  }
}
