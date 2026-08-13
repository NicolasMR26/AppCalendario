// CORS is a browser-only restriction (curl/native callers were never
// blocked by it) — the function still enforces real auth via the
// Authorization header regardless of origin, so a wildcard is fine here.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Call first in every handler; returns a response for preflight, or null to continue. */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
