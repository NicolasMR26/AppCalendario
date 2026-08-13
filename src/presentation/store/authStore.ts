import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@data/remote/supabaseClient";
import { flushPendingSync, pullRemoteData } from "@data/repositories";
import { useNotesStore } from "./notesStore";
import { useSubjectsStore } from "./subjectsStore";

/**
 * Runs whenever a session becomes active (cold start with a persisted
 * session, or an interactive sign-in): downloads anything synced from
 * another device, pushes whatever was queued locally, then reloads the
 * subjects/notes stores so the UI reflects what pull just wrote to disk.
 */
async function syncAfterSignIn(): Promise<void> {
  await pullRemoteData();
  await flushPendingSync();
  await Promise.all([useSubjectsStore.getState().load(), useNotesStore.getState().loadAll()]);
}

interface AuthState {
  session: Session | null;
  isReady: boolean;
  error: string | null;
  init: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/** Cloud sync + email alerts are opt-in: the app is fully usable signed-out (local-only). */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isReady: !isSupabaseConfigured,
  error: null,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ isReady: true });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isReady: true });
      if (data.session) void syncAfterSignIn();
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) void syncAfterSignIn();
    });
  },

  signUp: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) set({ error: error.message });
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ error: error.message });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
