import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/** Service-role client for Edge Functions — bypasses RLS, never expose this key to the app. */
export function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
