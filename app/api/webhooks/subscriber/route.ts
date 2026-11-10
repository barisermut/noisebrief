import { NextRequest, NextResponse } from "next/server";
import { maskEmail } from "@/lib/maskEmail";
import { EMAIL_FROM, getResendClient, escapeHtml } from "@/lib/email-utils";
import { secretMatches } from "@/lib/auth";

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: { email?: string; subscribed_at?: string };
};

export async function POST(request: NextRequest) {
  try {
    if (!secretMatches(request.headers.get("x-webhook-secret") ?? "", process.env.WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: WebhookPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (body.type !== "INSERT" || !body.record?.email || typeof body.record.email !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      console.error("Webhook subscriber: OWNER_EMAIL not set");
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const email = body.record.email;
    const subscribedAt = body.record.subscribed_at ?? "—";
    const masked = maskEmail(email);

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>New subscriber</title></head>
<body style="margin:0;background:#0a0a0f;color:#e4e4e7;font-family:system-ui,sans-serif;padding:24px;">
<p style="color:#ffffff;font-size:16px;margin:0 0 8px;">New subscriber: ${escapeHtml(masked)}</p>
<p style="color:#71717a;font-size:14px;margin:0;">Subscribed at: ${escapeHtml(String(subscribedAt))}</p>
</body>
</html>`;

    const client = getResendClient();
    const { error } = await client.emails.send({
      from: EMAIL_FROM,
      to: [ownerEmail],
      subject: "New Noisebrief subscriber",
      html,
    });

    if (error) {
      console.error("Webhook subscriber send error", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook subscriber error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
