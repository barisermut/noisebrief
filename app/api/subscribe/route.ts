import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { allowRequest, subscribeRatelimiter } from "@/lib/ratelimit";
import { sendConfirmEmail } from "@/lib/resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const error = (code: string, status: number) => NextResponse.json({ error: code }, { status });

/**
 * Double opt-in. Always answers "check_email" so the response never reveals whether an
 * address is already subscribed. Only a click on the confirmation link activates delivery.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await allowRequest(subscribeRatelimiter, request))) return error("rate_limited", 429);

    let body: { email?: unknown };
    try {
      body = await request.json();
    } catch {
      return error("invalid_email", 400);
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
      return error("invalid_email", 400);
    }

    const admin = getSupabaseAdmin();
    const { data: row, error: selectError } = await admin
      .from("email_subscribers")
      .select("id, unsubscribed_at, confirmed_at, unsubscribe_token")
      .eq("email", email)
      .maybeSingle();
    if (selectError) {
      console.error("Subscribe select error", selectError);
      return error("server_error", 500);
    }

    let token: string;
    if (!row) {
      token = crypto.randomUUID();
      const { error: insertError } = await admin
        .from("email_subscribers")
        .insert({ email, unsubscribe_token: token, confirmed_at: null });
      if (insertError) {
        console.error("Subscribe insert error", insertError);
        return error("server_error", 500);
      }
    } else if (row.unsubscribed_at === null && row.confirmed_at !== null) {
      // Already active: nothing to do, and nothing to reveal.
      return NextResponse.json({ message: "check_email" });
    } else if (row.unsubscribed_at === null) {
      // Pending confirmation: resend the same link.
      token = row.unsubscribe_token;
    } else {
      // Previously unsubscribed: start a fresh pending subscription.
      token = crypto.randomUUID();
      const { error: updateError } = await admin
        .from("email_subscribers")
        .update({ unsubscribed_at: null, confirmed_at: null, unsubscribe_token: token })
        .eq("id", row.id);
      if (updateError) {
        console.error("Subscribe update error", updateError);
        return error("server_error", 500);
      }
    }

    try {
      await sendConfirmEmail(email, token);
    } catch {
      return error("server_error", 500);
    }
    return NextResponse.json({ message: "check_email" });
  } catch (err) {
    console.error("Subscribe unexpected error", err);
    return error("server_error", 500);
  }
}
