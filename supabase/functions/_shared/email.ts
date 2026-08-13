// Thin wrapper around the Resend HTTP API. Swap the implementation here if
// you'd rather use SendGrid — the call sites in the two functions don't change.

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = formatFromAddress(Deno.env.get("ALERT_FROM_EMAIL") ?? "DayGridK&N <alerts@daygridkn.app>");
  if (!apiKey) throw new Error("RESEND_API_KEY secret is not set");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

/**
 * RFC 5322 requires a display name containing special characters (our "&"
 * in "DayGridK&N", for one) to be quoted — `"DayGridK&N" <a@b.com>`, not
 * `DayGridK&N <a@b.com>`. Some providers reject the unquoted form outright.
 */
function formatFromAddress(raw: string): string {
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<(.+)>\s*$/);
  if (!match) return raw;
  const [, name, email] = match;
  if (!name.trim()) return `<${email}>`;
  return `"${name.trim().replace(/"/g, '\\"')}" <${email}>`;
}

export function examAlertHtml(subjectName: string, noteText: string, date: string | null): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#16181D;">Recordatorio · ${escapeHtml(subjectName)}</h2>
      <p style="color:#444; font-size:15px;">${escapeHtml(noteText)}</p>
      ${date ? `<p style="color:#71757F; font-size:13px;">Fecha: ${escapeHtml(date)}</p>` : ""}
      <p style="color:#9296A3; font-size:12px; margin-top:24px;">Enviado por DayGridK&amp;N</p>
    </div>
  `;
}

export function scheduleChangeHtml(subjectName: string, oldInfo: string, newInfo: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#16181D;">Cambio de horario · ${escapeHtml(subjectName)}</h2>
      <p style="color:#444; font-size:15px;">Antes: ${escapeHtml(oldInfo)}</p>
      <p style="color:#444; font-size:15px;">Ahora: ${escapeHtml(newInfo)}</p>
      <p style="color:#9296A3; font-size:12px; margin-top:24px;">Enviado por DayGridK&amp;N</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
