import { getSupabaseAdmin } from "@/lib/supabase";
import { maskEmail } from "@/lib/maskEmail";
import { sendDigestEmail } from "@/lib/resend";
import { normalizeParagraphs, type ParagraphsField } from "@/types/brief";

export type DigestResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; reason: "no_brief_today" | "no_subscribers" | "subscriber_fetch_error" };

/**
 * Runs the digest: loads today's brief and active subscribers, sends digest emails.
 * Used by the daily cron (after brief is stored) and by /api/cron/digest for manual trigger.
 */
export async function runDigest(): Promise<DigestResult> {
  const today = new Date().toISOString().slice(0, 10);

  const admin = getSupabaseAdmin();

  const { data: briefRow, error: briefError } = await admin
    .from("daily_briefs")
    .select("date, title, paragraphs")
    .eq("date", today)
    .maybeSingle();

  if (briefError || !briefRow) {
    return { ok: false, reason: "no_brief_today" };
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

  const { data: subData, error: subError } = await admin
    .from("email_subscribers")
    .select("email, unsubscribe_token")
    .is("unsubscribed_at", null)
    .order("subscribed_at", { ascending: true });

  if (subError) {
    return { ok: false, reason: "subscriber_fetch_error" };
  }

  if (!subData || subData.length === 0) {
    return { ok: false, reason: "no_subscribers" };
  }

  let sent = 0;
  let failed = 0;

  // Resend limit: 2 requests per second. Send in batches of 2 with 1s gap.
  const BATCH_SIZE = 2;
  const MS_PER_BATCH = 1000;
  for (let i = 0; i < subData.length; i += BATCH_SIZE) {
    if (i > 0) await new Promise((r) => setTimeout(r, MS_PER_BATCH));
    const batch = subData.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((sub) => sendDigestEmail(sub.email, brief, sub.unsubscribe_token))
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled") {
        sent++;
      } else {
        console.error(
          `Digest send failed to=${maskEmail(batch[j].email)}`,
          (results[j] as PromiseRejectedResult).reason
        );
        failed++;
      }
    }
  }

  return { ok: true, sent, failed };
}
