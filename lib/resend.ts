import type { BriefParagraph } from "@/types/brief";
import { maskEmail } from "@/lib/maskEmail";
import { getResendClient, escapeHtml } from "@/lib/email-utils";

const FROM = "Noisebrief <briefs@noisebrief.com>";
const REPLY_TO = "briefs@noisebrief.com";
const UNSUBSCRIBE_BASE = "https://www.noisebrief.com/api/unsubscribe";
const SITE_URL = "https://www.noisebrief.com";

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Renders one paragraph: escaped text with every keyword replaced by a link. Processes by position to avoid double-replace. */
function paragraphToHtml(p: BriefParagraph): string {
  if (p.keywords.length === 0) {
    return `<p style="color:#3f3f46;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;margin:0 0 20px;">${escapeHtml(p.text)}</p>`;
  }
  type WithIdx = { keyword: string; url: string; idx: number };
  const withIdx: WithIdx[] = [];
  for (const k of p.keywords) {
    const idx = p.text.indexOf(k.keyword);
    if (idx >= 0) withIdx.push({ keyword: k.keyword, url: k.url, idx });
  }
  withIdx.sort((a, b) => a.idx - b.idx);
  let lastEnd = 0;
  const parts: string[] = [];
  for (const k of withIdx) {
    if (k.idx < lastEnd) continue;
    parts.push(escapeHtml(p.text.slice(lastEnd, k.idx)));
    parts.push(
      `<a href="${escapeAttr(k.url)}" style="color:#00a87e;text-decoration:none;">${escapeHtml(k.keyword)}</a>`
    );
    lastEnd = k.idx + k.keyword.length;
  }
  parts.push(escapeHtml(p.text.slice(lastEnd)));
  const content = parts.join("");
  return `<p style="color:#3f3f46;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;margin:0 0 20px;">${content}</p>`;
}

const EMAIL_LOGO_IMG =
  '<img src="https://www.noisebrief.com/logo.png" width="40" height="40" alt="Noisebrief" style="display:block;border:0;">';

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
  const d = new Date(brief.date + "T00:00:00Z");
  const formattedDate = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const fullDate = d
    .toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();

  const subject = `Noisebrief | ${formattedDate} — ${brief.title}`;
  const bodyParagraphs = brief.paragraphs.map(paragraphToHtml).join("");
  const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(unsubscribeToken)}`;

  const html = [
    '<!DOCTYPE html><html style="color-scheme: light only;"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;" bgcolor="#f4f4f0">',
    '<tr><td align="center" style="padding:0;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;display:block;">',

    // Header
    '<tr><td style="background:#f4f4f0;padding:32px 40px;" bgcolor="#f4f4f0">',
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">',
    EMAIL_LOGO_IMG,
    '</td><td style="vertical-align:middle;padding-left:10px;"><span style="color:#1a1a1a;font-size:22px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:-0.5px;">noisebrief<span style="color:#00d4aa;">.</span></span></td></tr></table>',
    `<p style="color:#888888;font-size:12px;font-family:Arial,sans-serif;margin:8px 0 0 0;letter-spacing:0.05em;">${escapeHtml(fullDate)}</p>`,
    "</td></tr>",

    // Body
    '<tr><td style="background:#f4f4f0;padding:32px 40px 24px 40px;" bgcolor="#f4f4f0">',
    `<p style="color:#1a1a1a;font-size:22px;font-weight:700;font-family:Arial,sans-serif;line-height:1.3;margin:0 0 24px;">${escapeHtml(brief.title)}</p>`,
    bodyParagraphs,
    "</td></tr>",

    // Divider
    '<tr><td style="background:#f4f4f0;padding:0 40px;" bgcolor="#f4f4f0"><div style="border-top:1px solid #e4e4e2;margin:8px 0 28px 0;"></div></td></tr>',

    // CTA
    '<tr><td align="center" style="background:#f4f4f0;padding:0 40px 32px 40px;" bgcolor="#f4f4f0">',
    `<a href="${escapeAttr(SITE_URL)}" style="background:#0a0a0f;color:#ffffff;padding:11px 24px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">View sources &amp; past briefs →</a>`,
    "</td></tr>",

    // Footer
    '<tr><td style="background:#f4f4f0;padding:24px 40px;text-align:center;" bgcolor="#f4f4f0">',
    '<p style="color:#888888;font-size:12px;font-family:Arial,sans-serif;margin:0;">You\'re receiving this because you subscribed at noisebrief.com.</p>',
    `<p style="color:#888888;font-size:12px;font-family:Arial,sans-serif;margin:8px 0 0 0;"><a href="${escapeAttr(unsubscribeUrl)}" style="color:#888888;font-size:12px;text-decoration:underline;">Unsubscribe</a></p>`,
    "</td></tr>",

    "</table></td></tr></table></body></html>",
  ].join("");

  try {
    const { error } = await getResendClient().emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `Digest send failed to=${maskEmail(to)} date=${brief.date}`,
          error
        );
      }
      throw error;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `Digest send failed to=${maskEmail(to)} date=${brief.date}`,
        err
      );
    }
    throw err;
  }
}

/** Welcome email sent immediately after subscribe. Same layout/styling as digest. */
export async function sendWelcomeEmail(
  to: string,
  unsubscribeToken: string
): Promise<void> {
  const now = new Date();
  const fullDate = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();

  const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(unsubscribeToken)}`;

  const p1 = "Welcome to Noisebrief, your daily one-pager on what's happening in tech. No noise, no fluff. Just the signal that matters.";
  const p2 = "Every day at 8:30 AM UTC, we fetch the latest from Hacker News, TechCrunch, The Verge, Wired, and the best corners of Reddit, summarize it with AI, and send it straight to your inbox.";
  const p3 = "Your first brief arrives tomorrow morning. Until then, you can read today's brief and browse past ones on the site.";
  const bodyParagraphs = [
    `<p style="color:#3f3f46;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;margin:0 0 20px;">${escapeHtml(p1)}</p>`,
    `<p style="color:#3f3f46;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;margin:0 0 20px;">${escapeHtml(p2)}</p>`,
    `<p style="color:#3f3f46;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;margin:0 0 20px;">${escapeHtml(p3)}</p>`,
  ].join("");

  const html = [
    '<!DOCTYPE html><html style="color-scheme: light only;"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;" bgcolor="#f4f4f0">',
    '<tr><td align="center" style="padding:0;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;display:block;">',

    // Header — same structure as sendDigestEmail: SVG icon + wordmark with teal dot + date
    '<tr><td style="background:#f4f4f0;padding:32px 40px;" bgcolor="#f4f4f0">',
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">',
    EMAIL_LOGO_IMG,
    '</td><td style="vertical-align:middle;padding-left:10px;"><span style="color:#1a1a1a;font-size:22px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:-0.5px;">noisebrief<span style="color:#00d4aa;">.</span></span></td></tr></table>',
    `<p style="color:#888888;font-size:12px;font-family:Arial,sans-serif;margin:8px 0 0 0;letter-spacing:0.05em;">${escapeHtml(fullDate)}</p>`,
    "</td></tr>",

    '<tr><td style="background:#f4f4f0;padding:32px 40px 24px 40px;" bgcolor="#f4f4f0">',
    '<p style="color:#1a1a1a;font-size:22px;font-weight:700;font-family:Arial,sans-serif;line-height:1.3;margin:0 0 24px;">You\'re in.</p>',
    bodyParagraphs,
    "</td></tr>",

    '<tr><td style="background:#f4f4f0;padding:0 40px;" bgcolor="#f4f4f0"><div style="border-top:1px solid #e4e4e2;margin:8px 0 28px 0;"></div></td></tr>',

    '<tr><td align="center" style="background:#f4f4f0;padding:0 40px 32px 40px;" bgcolor="#f4f4f0">',
    `<a href="${escapeAttr(SITE_URL)}" style="background:#0a0a0f;color:#ffffff;padding:11px 24px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">Read today\'s brief →</a>`,
    "</td></tr>",

    '<tr><td style="background:#f4f4f0;padding:24px 40px;text-align:center;" bgcolor="#f4f4f0">',
    '<p style="color:#888888;font-size:12px;font-family:Arial,sans-serif;margin:0;">You\'re receiving this because you subscribed at noisebrief.com.</p>',
    `<p style="color:#888888;font-size:12px;font-family:Arial,sans-serif;margin:8px 0 0 0;"><a href="${escapeAttr(unsubscribeUrl)}" style="color:#888888;font-size:12px;text-decoration:underline;">Unsubscribe</a></p>`,
    "</td></tr>",

    "</table></td></tr></table></body></html>",
  ].join("");

  try {
    const { error } = await getResendClient().emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject: "Welcome to Noisebrief.",
      html,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Welcome email failed to=${maskEmail(to)}`, error);
      }
      throw error;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Welcome email failed to=${maskEmail(to)}`, err);
    }
    throw err;
  }
}
