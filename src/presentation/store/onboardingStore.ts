import { create } from "zustand";
import { getHasSeenOnboarding, setHasSeenOnboarding } from "@data/local/onboardingFlag";

interface OnboardingState {
  hasSeenOnboarding: boolean | null; // null = not loaded yet
  load: () => Promise<void>;
  finish: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: null,

  load: async () => {
    const value = await getHasSeenOnboarding();
    set({ hasSeenOnboarding: value });
  },

  finish: async () => {
    await setHasSeenOnboarding(true);
    set({ hasSeenOnboarding: true });
  },
}));
