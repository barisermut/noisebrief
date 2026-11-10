import { getSupabaseAdmin } from "@/lib/supabase";
import { allowRequest, unsubscribeRatelimiter } from "@/lib/ratelimit";
import { readToken, statusPage } from "@/lib/html-page";

const INVALID = { title: "Invalid link", message: "This unsubscribe link is invalid or has already been used." };
const FAILED = { title: "Something went wrong", message: "Please try again or contact us at briefs@noisebrief.com." };

/**
 * GET only shows a confirm button: email security scanners (Outlook Safe Links etc.)
 * open every link, which used to unsubscribe people silently.
 */
export async function GET(request: Request) {
  const token = await readToken(request);
  if (!token) return statusPage(INVALID);
  return statusPage({
    title: "Unsubscribe from Noisebrief?",
    message: "You'll stop getting the daily brief by email.",
    form: { action: "/api/unsubscribe", token, label: "Unsubscribe" },
    backLink: true,
  });
}

/** Handles the confirm form and RFC 8058 one-click POSTs from mail clients (token in the query). */
export async function POST(request: Request) {
  if (!(await allowRequest(unsubscribeRatelimiter, request))) {
    return statusPage({ title: "Too many requests", message: "Please wait a moment and try again.", status: 429 });
  }
  const token = await readToken(request);
  if (!token) return statusPage(INVALID);

  try {
    const admin = getSupabaseAdmin();
    const { data: row, error } = await admin
      .from("email_subscribers")
      .select("id, unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (error) {
      console.error("Unsubscribe select error", error);
      return statusPage(FAILED);
    }
    if (!row) return statusPage(INVALID);

    if (row.unsubscribed_at === null) {
      const { error: updateError } = await admin
        .from("email_subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updateError) {
        console.error("Unsubscribe update error", updateError);
        return statusPage(FAILED);
      }
    }
    return statusPage({
      title: "You're unsubscribed.",
      message: "You won't receive any more emails from Noisebrief. We're sorry to see you go.",
      backLink: true,
    });
  } catch (err) {
    console.error("Unsubscribe unexpected error", err);
    return statusPage(FAILED);
  }
}
