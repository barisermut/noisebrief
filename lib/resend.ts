import type { BriefParagraph } from "@/types/brief";
import { maskEmail } from "@/lib/maskEmail";
import { EMAIL_FROM, EMAIL_REPLY_TO, getResendClient, escapeHtml } from "@/lib/email-utils";
import { getSiteUrl } from "@/lib/site";

const P_STYLE = "color:#3f3f46;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;margin:0 0 20px;";
const SMALL_STYLE = "color:#888888;font-size:12px;font-family:Arial,sans-serif;";

export function unsubscribeUrl(token: string): string {
  return `${getSiteUrl()}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function confirmUrl(token: string): string {
  return `${getSiteUrl()}/api/confirm?token=${encodeURIComponent(token)}`;
}

/** RFC 8058 one-click unsubscribe headers (required by Gmail / Yahoo for bulk senders). */
function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function formatFullDate(d: Date): string {
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();
}

function textParagraph(text: string): string {
  return `<p style="${P_STYLE}">${escapeHtml(text)}</p>`;
}

/** Renders one paragraph: escaped text with every keyword replaced by a link. Processes by position to avoid double-replace. */
function paragraphToHtml(p: BriefParagraph): string {
  const withIdx = p.keywords
    .map((k) => ({ ...k, idx: p.text.indexOf(k.keyword) }))
    .filter((k) => k.idx >= 0)
    .sort((a, b) => a.idx - b.idx);
  let lastEnd = 0;
  const parts: string[] = [];
  for (const k of withIdx) {
    if (k.idx < lastEnd) continue;
    parts.push(escapeHtml(p.text.slice(lastEnd, k.idx)));
    parts.push(
      `<a href="${escapeHtml(k.url)}" style="color:#00a87e;text-decoration:none;">${escapeHtml(k.keyword)}</a>`
    );
    lastEnd = k.idx + k.keyword.length;
  }
  parts.push(escapeHtml(p.text.slice(lastEnd)));
  return `<p style="${P_STYLE}">${parts.join("")}</p>`;
}

interface EmailLayout {
  date: Date;
  heading: string;
  bodyHtml: string;
  cta: { href: string; label: string };
  /** Footer HTML (already escaped). */
  footerHtml: string;
}

function renderEmail({ date, heading, bodyHtml, cta, footerHtml }: EmailLayout): string {
  const site = getSiteUrl();
  const cell = (style: string, content: string, align = "") =>
    `<tr><td${align ? ` align="${align}"` : ""} style="background:#f4f4f0;${style}" bgcolor="#f4f4f0">${content}</td></tr>`;
  return [
    '<!DOCTYPE html><html style="color-scheme: light only;"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;" bgcolor="#f4f4f0">',
    '<tr><td align="center" style="padding:0;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;display:block;">',
    cell(
      "padding:32px 40px;",
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">' +
        `<img src="${escapeHtml(site)}/logo.png" width="40" height="40" alt="Noisebrief" style="display:block;border:0;">` +
        '</td><td style="vertical-align:middle;padding-left:10px;"><span style="color:#1a1a1a;font-size:22px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:-0.5px;">noisebrief<span style="color:#00d4aa;">.</span></span></td></tr></table>' +
        `<p style="${SMALL_STYLE}margin:8px 0 0 0;letter-spacing:0.05em;">${escapeHtml(formatFullDate(date))}</p>`
    ),
    cell(
      "padding:32px 40px 24px 40px;",
      `<p style="color:#1a1a1a;font-size:22px;font-weight:700;font-family:Arial,sans-serif;line-height:1.3;margin:0 0 24px;">${escapeHtml(heading)}</p>` +
        bodyHtml
    ),
    cell("padding:0 40px;", '<div style="border-top:1px solid #e4e4e2;margin:8px 0 28px 0;"></div>'),
    cell(
      "padding:0 40px 32px 40px;",
      `<a href="${escapeHtml(cta.href)}" style="background:#0a0a0f;color:#ffffff;padding:11px 24px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${escapeHtml(cta.label)}</a>`,
      "center"
    ),
    cell("padding:24px 40px;text-align:center;", footerHtml),
    "</table></td></tr></table></body></html>",
  ].join("");
}

function subscribedFooter(token: string): string {
  return (
    `<p style="${SMALL_STYLE}margin:0;">You're receiving this because you subscribed at noisebrief.com.</p>` +
    `<p style="${SMALL_STYLE}margin:8px 0 0 0;"><a href="${escapeHtml(unsubscribeUrl(token))}" style="color:#888888;font-size:12px;text-decoration:underline;">Unsubscribe</a></p>`
  );
}

async function send(
  to: string,
  subject: string,
  html: string,
  label: string,
  headers?: Record<string, string>
): Promise<void> {
  const { error } = await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: [to],
    replyTo: EMAIL_REPLY_TO,
    subject,
    html,
    headers,
  });
  if (error) {
    console.error(`${label} send failed to=${maskEmail(to)}`, error.message);
    throw new Error(error.message);
  }
}

export interface DigestBrief {
  title: string;
  paragraphs: BriefParagraph[];
  date: string;
}

export async function sendDigestEmail(to: string, brief: DigestBrief, token: string): Promise<void> {
  const d = new Date(brief.date + "T00:00:00Z");
  const shortDate = d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const html = renderEmail({
    date: d,
    heading: brief.title,
    bodyHtml: brief.paragraphs.map(paragraphToHtml).join(""),
    cta: { href: getSiteUrl(), label: "View sources & past briefs →" },
    footerHtml: subscribedFooter(token),
  });
  await send(to, `Noisebrief | ${shortDate} : ${brief.title}`, html, `Digest ${brief.date}`, unsubscribeHeaders(token));
}

/** Sent once the subscriber confirms their address. */
export async function sendWelcomeEmail(to: string, token: string): Promise<void> {
  const html = renderEmail({
    date: new Date(),
    heading: "You're in.",
    bodyHtml: [
      "Welcome to Noisebrief, your daily one-pager on what's happening in tech. No noise, no fluff. Just the signal that matters.",
      "Every morning at around 8 AM UTC, we fetch the latest from Hacker News, TechCrunch, The Verge, Wired, and the best corners of Reddit, summarize it with AI, and send it straight to your inbox.",
      "Until then, you can read today's brief and browse past ones on the site.",
    ]
      .map(textParagraph)
      .join(""),
    cta: { href: getSiteUrl(), label: "Read today's brief →" },
    footerHtml: subscribedFooter(token),
  });
  await send(to, "Welcome to Noisebrief.", html, "Welcome", unsubscribeHeaders(token));
}

/** Double opt-in: asks the address owner to confirm before any digest is sent. */
export async function sendConfirmEmail(to: string, token: string): Promise<void> {
  const html = renderEmail({
    date: new Date(),
    heading: "Confirm your subscription",
    bodyHtml: textParagraph(
      "Someone (hopefully you) asked to get the Noisebrief daily digest at this address. Confirm below and the first brief arrives tomorrow morning."
    ),
    cta: { href: confirmUrl(token), label: "Confirm subscription →" },
    footerHtml: `<p style="${SMALL_STYLE}margin:0;">Didn't sign up? Ignore this email and you won't hear from us again.</p>`,
  });
  await send(to, "Confirm your Noisebrief subscription", html, "Confirm");
}
