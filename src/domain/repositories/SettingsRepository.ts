import type { UserSettings } from "@domain/entities/UserSettings";

export interface SettingsRepository {
  get(): Promise<UserSettings>;
  update(patch: Partial<UserSettings>): Promise<UserSettings>;
}
