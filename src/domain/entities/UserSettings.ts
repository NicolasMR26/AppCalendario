export type ThemeMode = "light" | "dark" | "system";

export interface UserSettings {
  alertEmail: string | null;
  themeMode: ThemeMode;
  reminderLeadDays: number; // how many days before a note's date to send the alert
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  alertEmail: null,
  themeMode: "system",
  reminderLeadDays: 2,
};
