// HTTP-invokable Edge Function the app calls directly (via
// `supabase.functions.invoke("send-alert-email", { body })`) for on-demand
// sends: a "send test email" button in Settings, or firing a reminder the
// instant a user turns on alert_email for a note that's already due soon.
// The daily sweep in `schedule-alerts` covers everything else automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { examAlertHtml, sendEmail } from "../_shared/email.ts";

interface TestPayload {
  type: "test";
}

interface NotePayload {
  type: "note";
  noteId: string;
}

type RequestPayload = TestPayload | NotePayload;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Missing Authorization header", { status: 401 });

  // User-scoped client: RLS still applies, so a caller can only ever touch their own rows.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return new Response("Invalid session", { status: 401 });
  const user = userData.user;

  let payload: RequestPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { data: settings } = await supabase
    .from("user_settings")
    .select("alert_email")
    .eq("user_id", user.id)
    .maybeSingle();
  const recipient = settings?.alert_email || user.email;
  if (!recipient) return new Response("No alert email configured", { status: 422 });

  try {
    if (payload.type === "test") {
      await sendEmail({
        to: recipient,
        subject: "DayGridK&N — correo de prueba",
        html: examAlertHtml("DayGridK&N", "Este es un correo de prueba. Tus alertas llegarán así.", null),
      });
      return json({ ok: true });
    }

    if (payload.type === "note") {
      const { data: note, error: noteError } = await supabase
        .from("notes")
        .select("id, text, date, subject_id, subjects!inner(name)")
        .eq("id", payload.noteId)
        .single();
      if (noteError || !note) return new Response("Note not found", { status: 404 });

      const subjectName = (note as any).subjects.name as string;
      await sendEmail({
        to: recipient,
        subject: `Recordatorio: ${subjectName}`,
        html: examAlertHtml(subjectName, note.text, note.date),
      });
      await supabase.from("notes").update({ alert_sent_at: new Date().toISOString() }).eq("id", note.id);
      return json({ ok: true });
    }

    return new Response("Unknown payload type", { status: 400 });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
