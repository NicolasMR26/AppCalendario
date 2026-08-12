import { create } from "zustand";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@domain/entities/UserSettings";
import { settingsRepository } from "@data/repositories";

interface SettingsState {
  settings: UserSettings;
  isLoaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_USER_SETTINGS,
  isLoaded: false,

  load: async () => {
    const settings = await settingsRepository.get();
    set({ settings, isLoaded: true });
  },

  update: async (patch) => {
    const previous = get().settings;
    set({ settings: { ...previous, ...patch } });
    try {
      const updated = await settingsRepository.update(patch);
      set({ settings: updated });
    } catch {
      set({ settings: previous });
    }
  },
}));
