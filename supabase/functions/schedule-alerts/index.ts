// Deployed as a Supabase Edge Function and triggered daily by pg_cron (see
// schema.sql, bottom). Two jobs per run:
//  1. Exam/entrega reminders: notes with alert_email = true, a date within
//     the user's reminder_lead_days window, and not yet sent.
//  2. Schedule-change notifications queued by the `subjects` trigger.

import { examAlertHtml, scheduleChangeHtml, sendEmail } from "../_shared/email.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (_req) => {
  const supabase = getSupabaseAdmin();
  const results = { remindersSent: 0, scheduleChangesSent: 0, errors: [] as string[] };

  // --- 1. Due-date reminders -------------------------------------------------
  const { data: dueNotes, error: notesError } = await supabase
    .from("notes")
    .select("id, text, date, subject_id, subjects!inner(id, name, user_id)")
    .eq("alert_email", true)
    .is("alert_sent_at", null)
    .not("date", "is", null);

  if (notesError) results.errors.push(`notes query: ${notesError.message}`);

  for (const note of dueNotes ?? []) {
    try {
      const subject = (note as any).subjects as { id: string; name: string; user_id: string };
      const { data: settings } = await supabase
        .from("user_settings")
        .select("alert_email, reminder_lead_days")
        .eq("user_id", subject.user_id)
        .maybeSingle();

      const { data: authUser } = await supabase.auth.admin.getUserById(subject.user_id);
      const recipient = settings?.alert_email || authUser?.user?.email;
      if (!recipient) continue;

      const leadDays = settings?.reminder_lead_days ?? 2;
      const dueDate = new Date(`${note.date}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);

      if (daysUntilDue < 0 || daysUntilDue > leadDays) continue;

      await sendEmail({
        to: recipient,
        subject: `Recordatorio: ${subject.name}`,
        html: examAlertHtml(subject.name, note.text, note.date),
      });

      await supabase.from("notes").update({ alert_sent_at: new Date().toISOString() }).eq("id", note.id);
      results.remindersSent += 1;
    } catch (err) {
      results.errors.push(`note ${note.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // --- 2. Schedule-change notifications ---------------------------------------
  const { data: pendingChanges, error: queueError } = await supabase
    .from("alert_queue")
    .select("id, user_id, payload")
    .eq("kind", "schedule_change")
    .is("sent_at", null);

  if (queueError) results.errors.push(`alert_queue query: ${queueError.message}`);

  for (const change of pendingChanges ?? []) {
    try {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("alert_email")
        .eq("user_id", change.user_id)
        .maybeSingle();
      const { data: authUser } = await supabase.auth.admin.getUserById(change.user_id);
      const recipient = settings?.alert_email || authUser?.user?.email;
      if (!recipient) continue;

      const payload = change.payload as Record<string, unknown>;
      const oldInfo = `${dayName(payload.old_day as number)} ${payload.old_start_time}–${payload.old_end_time}`;
      const newInfo = `${dayName(payload.new_day as number)} ${payload.new_start_time}–${payload.new_end_time}`;

      await sendEmail({
        to: recipient,
        subject: `Cambio de horario: ${payload.subject_name}`,
        html: scheduleChangeHtml(String(payload.subject_name), oldInfo, newInfo),
      });

      await supabase.from("alert_queue").update({ sent_at: new Date().toISOString() }).eq("id", change.id);
      results.scheduleChangesSent += 1;
    } catch (err) {
      results.errors.push(`alert_queue ${change.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
});

function dayName(day: number): string {
  return ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][day] ?? String(day);
}
