import { Resend } from "resend";
import type { BriefParagraph } from "@/types/brief";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error("Missing RESEND_API_KEY");
}
const resend = new Resend(apiKey);

const FROM = "Noisebrief <briefs@noisebrief.com>";
const REPLY_TO = "briefs@noisebrief.com";
const UNSUBSCRIBE_BASE = "https://www.noisebrief.com/unsubscribe";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Renders one paragraph as HTML: escaped text with optional first keyword linked. */
function paragraphToHtml(p: BriefParagraph): string {
  if (p.keywords.length === 0) {
    return `<p style="margin:0 0 1em;line-height:1.5;">${escapeHtml(p.text)}</p>`;
  }
  const first = p.keywords[0];
  const idx = p.text.indexOf(first.keyword);
  if (idx === -1) {
    return `<p style="margin:0 0 1em;line-height:1.5;">${escapeHtml(p.text)}</p>`;
  }
  const before = p.text.slice(0, idx);
  const after = p.text.slice(idx + first.keyword.length);
  const link = `<a href="${escapeAttr(first.url)}" style="color:#888;text-decoration:underline;">${escapeHtml(first.keyword)}</a>`;
  const content = escapeHtml(before) + link + escapeHtml(after);
  return `<p style="margin:0 0 1em;line-height:1.5;">${content}</p>`;
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***@***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const prefix = local.length >= 3 ? local.slice(0, 3) : local.slice(0, 1) || "?";
  return `${prefix}***@${domain}`;
}

export interface DigestBrief {
  title: string;
  paragraphs: BriefParagraph[];
  date: string;
}

export async function sendDigestEmail(
  to: string,
  brief: DigestBrief,
  unsubscribeToken: string
): Promise<void> {
  const bodyParagraphs = brief.paragraphs.map(paragraphToHtml).join("");
  const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(unsubscribeToken)}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;letter-spacing:-0.02em;">noisebrief.</p>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">${escapeHtml(brief.date)}</p>
    <div style="margin-bottom:24px;">
      ${bodyParagraphs}
    </div>
    <p style="margin:0;color:#888;font-size:12px;">You're receiving this because you subscribed at noisebrief.com. <a href="${escapeAttr(unsubscribeUrl)}" style="color:#888;text-decoration:underline;">Unsubscribe</a></p>
  </div>
</body>
</html>`.trim();

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject: `Noisebrief — ${brief.title}`,
      html,
    });
    if (error) {
      console.error(
        `Digest send failed to=${maskEmail(to)} date=${brief.date}`,
        error
      );
      throw error;
    }
  } catch (err) {
    console.error(
      `Digest send failed to=${maskEmail(to)} date=${brief.date}`,
      err
    );
    throw err;
  }
}
