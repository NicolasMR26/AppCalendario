import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = (extra.supabaseUrl as string) || "";
const supabaseAnonKey = (extra.supabaseAnonKey as string) || "";

/** True once EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are configured (see .env.example). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Expo Router's static web export pre-renders every route in Node (no
// `window`), but this module is imported transitively from the root layout,
// so `createClient()` runs there too — and AsyncStorage's web adapter reads
// `window.localStorage` synchronously inside GoTrueClient's constructor.
// This no-ops instead of touching `window` when there isn't one.
const ssrSafeStorage = {
  getItem: (key: string) => (typeof window === "undefined" ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    typeof window === "undefined" ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) => (typeof window === "undefined" ? Promise.resolve() : AsyncStorage.removeItem(key)),
};

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
