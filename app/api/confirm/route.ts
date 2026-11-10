import { getSupabaseAdmin } from "@/lib/supabase";
import { allowRequest, unsubscribeRatelimiter } from "@/lib/ratelimit";
import { readToken, statusPage } from "@/lib/html-page";
import { sendWelcomeEmail } from "@/lib/resend";

const INVALID = { title: "Invalid link", message: "This confirmation link is invalid or has expired." };
const FAILED = { title: "Something went wrong", message: "Please try again or contact us at briefs@noisebrief.com." };

/**
 * GET only shows a button: email security scanners open links automatically, so the
 * state change happens on POST.
 */
export async function GET(request: Request) {
  const token = await readToken(request);
  if (!token) return statusPage(INVALID);
  return statusPage({
    title: "Confirm your subscription",
    message: "One click and the daily brief lands in your inbox every morning.",
    form: { action: "/api/confirm", token, label: "Confirm subscription" },
  });
}

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
      .select("id, email, confirmed_at, unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (error) {
      console.error("Confirm select error", error);
      return statusPage(FAILED);
    }
    if (!row || row.unsubscribed_at !== null) return statusPage(INVALID);

    if (row.confirmed_at === null) {
      const { error: updateError } = await admin
        .from("email_subscribers")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updateError) {
        console.error("Confirm update error", updateError);
        return statusPage(FAILED);
      }
      try {
        await sendWelcomeEmail(row.email, token);
      } catch {
        // Subscription is active; the welcome email is a nice-to-have.
      }
    }
    return statusPage({
      title: "You're in.",
      message: "Your first brief arrives tomorrow morning.",
      backLink: true,
    });
  } catch (err) {
    console.error("Confirm unexpected error", err);
    return statusPage(FAILED);
  }
}
