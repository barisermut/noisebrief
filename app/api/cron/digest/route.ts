import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendDigestEmail } from "@/lib/resend";
import { normalizeParagraphs, type ParagraphsField } from "@/types/brief";

export const maxDuration = 60;

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***@***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const prefix = local.length >= 3 ? local.slice(0, 3) : local.slice(0, 1) || "?";
  return `${prefix}***@${domain}`;
}

export async function GET(request: Request) {
  const cronSecret = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (cronSecret !== expected || !process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const admin = getSupabaseAdmin();

  const { data: briefRow, error: briefError } = await admin
    .from("daily_briefs")
    .select("date, title, paragraphs")
    .eq("date", today)
    .maybeSingle();

  if (briefError || !briefRow) {
    return NextResponse.json({ message: "no_brief_today" });
  }

  const rawParagraphs = briefRow.paragraphs;
  const paragraphs = normalizeParagraphs(
    (Array.isArray(rawParagraphs) ? rawParagraphs : []) as ParagraphsField
  );
  const brief = {
    title: briefRow.title ?? "",
    paragraphs,
    date: briefRow.date,
  };

  const { data: subscribers, error: subError } = await admin
    .from("email_subscribers")
    .select("email, unsubscribe_token")
    .is("unsubscribed_at", null);

  if (subError || !subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: "no_subscribers" });
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await sendDigestEmail(sub.email, brief, sub.unsubscribe_token);
      sent++;
    } catch (err) {
      console.error(
        `Digest cron send failed to=${maskEmail(sub.email)}`,
        err
      );
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
