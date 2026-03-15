import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { unsubscribeRatelimiter, getClientIp } from "@/lib/ratelimit";

function htmlPage(title: string, message: string, showBackLink: boolean): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap" rel="stylesheet">
  <title>${title} — Noisebrief</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0f;
      color: #e4e4e7;
      font-family: "Syne", system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .wordmark {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 48px;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 0.875rem;
      color: #71717a;
      line-height: 1.6;
      max-width: 320px;
    }
    a {
      display: inline-block;
      margin-top: 32px;
      font-size: 0.85rem;
      color: #00d4aa;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wordmark">
  <svg aria-hidden="true" width="40" height="40" viewBox="0 0 32 32" fill="none" style="height:40px;width:40px;flex-shrink:0;">
    <path d="M7 6H11.5L16 13.5V6H20.5V26H16.5L11.5 17.5V26H7V6Z" fill="#00d4aa"/>
    <path d="M22 11 Q25 13.5 25 16 Q25 18.5 22 21" stroke="#00d4aa" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.9"/>
    <path d="M23.5 8.5 Q28 12 28 16 Q28 20 23.5 23.5" stroke="#00d4aa" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M25 6 Q31 10.5 31 16 Q31 21.5 25 26" stroke="#00d4aa" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.25"/>
  </svg>
  <span style="font-size:2rem;font-weight:700;color:#ffffff;letter-spacing:-0.03em;font-family: 'Syne', system-ui, sans-serif;">noisebrief<span style="color:#00d4aa;">.</span></span>
</div>
  <h1>${title}</h1>
  <p>${message}</p>
  ${showBackLink ? `<a href="https://www.noisebrief.com">← Back to Noisebrief</a>` : ""}
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  if (unsubscribeRatelimiter) {
    const ip = getClientIp(request);
    const { success } = await unsubscribeRatelimiter.limit(ip);
    if (!success) {
      return htmlPage("Too many requests", "Please wait a moment and try again.", false);
    }
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token || !token.trim()) {
    return htmlPage("Invalid link", "This unsubscribe link is invalid or has already been used.", false);
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: row, error: selectError } = await admin
      .from("email_subscribers")
      .select("id, unsubscribed_at")
      .eq("unsubscribe_token", token.trim())
      .maybeSingle();

    if (selectError) {
      console.error("Unsubscribe select error", selectError);
      return htmlPage("Something went wrong", "Please try again or contact us at briefs@noisebrief.com.", false);
    }

    if (!row) {
      return htmlPage("Invalid link", "This unsubscribe link is invalid or has already been used.", false);
    }

    if (row.unsubscribed_at !== null) {
      return htmlPage("Already unsubscribed", "This unsubscribe link is invalid or has already been used.", false);
    }

    const { error: updateError } = await admin
      .from("email_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", row.id);

    if (updateError) {
      console.error("Unsubscribe update error", updateError);
      return htmlPage("Something went wrong", "Please try again or contact us at briefs@noisebrief.com.", false);
    }

    return htmlPage("You're unsubscribed.", "You won't receive any more emails from Noisebrief. We're sorry to see you go.", true);
  } catch (err) {
    console.error("Unsubscribe unexpected error", err);
    return htmlPage("Something went wrong", "Please try again or contact us at briefs@noisebrief.com.", false);
  }
}
