import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { subscribeRatelimiter, getClientIp } from "@/lib/ratelimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (subscribeRatelimiter) {
      const ip = getClientIp(request);
      const { success } = await subscribeRatelimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "rate_limited" },
          { status: 429 }
        );
      }
    }

    let body: { email?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_email" },
        { status: 400 }
      );
    }

    const raw = body.email;
    if (typeof raw !== "string") {
      return NextResponse.json(
        { error: "invalid_email" },
        { status: 400 }
      );
    }

    const email = raw.trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "invalid_email" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const { data: row, error: selectError } = await admin
      .from("email_subscribers")
      .select("id, unsubscribed_at")
      .eq("email", email)
      .maybeSingle();

    if (selectError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Subscribe select error", selectError);
      }
      return NextResponse.json(
        { error: "server_error" },
        { status: 500 }
      );
    }

    if (row) {
      if (row.unsubscribed_at === null) {
        return NextResponse.json({ message: "subscribed" });
      }
      const newToken = crypto.randomUUID();
      const { error: updateError } = await admin
        .from("email_subscribers")
        .update({
          unsubscribed_at: null,
          unsubscribe_token: newToken,
        })
        .eq("id", row.id);

      if (updateError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Subscribe update error", updateError);
        }
        return NextResponse.json(
          { error: "server_error" },
          { status: 500 }
        );
      }
      return NextResponse.json({ message: "subscribed" });
    }

    const { error: insertError } = await admin.from("email_subscribers").insert({
      email,
      unsubscribe_token: crypto.randomUUID(),
    });

    if (insertError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Subscribe insert error", insertError);
      }
      return NextResponse.json(
        { error: "server_error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "subscribed" });
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("Subscribe unexpected error");
    }
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
