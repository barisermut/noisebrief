import { Resend } from "resend";

export const EMAIL_FROM = "Noisebrief <briefs@noisebrief.com>";
export const EMAIL_REPLY_TO = "briefs@noisebrief.com";

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  _resend = new Resend(key);
  return _resend;
}

/** Escapes text for HTML element content and double-quoted attributes. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
