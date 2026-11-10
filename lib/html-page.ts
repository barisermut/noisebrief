import { escapeHtml } from "@/lib/email-utils";
import { getSiteUrl } from "@/lib/site";

interface StatusPageOptions {
  title: string;
  message: string;
  /** Show a "Back to Noisebrief" link. */
  backLink?: boolean;
  /** Render a POST form with a single button (used for confirm / unsubscribe). */
  form?: { action: string; token: string; label: string };
  status?: number;
}

/** Small standalone HTML page for email-link flows (confirm, unsubscribe). */
export function statusPage({ title, message, backLink = false, form, status = 200 }: StatusPageOptions): Response {
  const formHtml = form
    ? `<form method="post" action="${escapeHtml(form.action)}">
    <input type="hidden" name="token" value="${escapeHtml(form.token)}">
    <button type="submit">${escapeHtml(form.label)}</button>
  </form>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(title)} | Noisebrief</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #e4e4e7; font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    .wordmark { display: flex; align-items: center; gap: 10px; margin-bottom: 48px; font-size: 2rem; font-weight: 700; color: #fff; letter-spacing: -0.03em; }
    .dot { color: #00d4aa; }
    h1 { font-size: 1.25rem; font-weight: 600; color: #fff; margin-bottom: 12px; letter-spacing: -0.02em; }
    p { font-size: 0.875rem; color: #a1a1aa; line-height: 1.6; max-width: 320px; }
    a { display: inline-block; margin-top: 32px; font-size: 0.85rem; color: #00d4aa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    button { margin-top: 28px; cursor: pointer; border: 0; border-radius: 6px; background: #00d4aa; color: #0a0a0f; font: inherit; font-size: 0.9rem; font-weight: 600; padding: 10px 22px; }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="wordmark">
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 32 32" fill="none">
      <path d="M7 6H11.5L16 13.5V6H20.5V26H16.5L11.5 17.5V26H7V6Z" fill="#00d4aa"/>
      <path d="M22 11 Q25 13.5 25 16 Q25 18.5 22 21" stroke="#00d4aa" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.9"/>
      <path d="M23.5 8.5 Q28 12 28 16 Q28 20 23.5 23.5" stroke="#00d4aa" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M25 6 Q31 10.5 31 16 Q31 21.5 25 26" stroke="#00d4aa" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.25"/>
    </svg>
    <span>noisebrief<span class="dot">.</span></span>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  ${formHtml}
  ${backLink ? `<a href="${escapeHtml(getSiteUrl())}">← Back to Noisebrief</a>` : ""}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Reads `token` from the query string or a form / one-click POST body. */
export async function readToken(request: Request): Promise<string> {
  const fromQuery = new URL(request.url).searchParams.get("token");
  if (fromQuery?.trim()) return fromQuery.trim();
  if (request.method !== "POST") return "";
  try {
    const form = await request.formData();
    const v = form.get("token");
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
}
