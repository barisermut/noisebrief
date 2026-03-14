import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const SITE_URL = "https://www.noisebrief.com";

const PAGE_STYLE =
  "background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:24px;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;";

function htmlPage(content: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="${PAGE_STYLE}"><div style="max-width:360px;">${content}</div></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || !token.trim()) {
    return htmlPage(
      "<p style='margin:0;'>This unsubscribe link is invalid or already used.</p>"
    );
  }

  const admin = getSupabaseAdmin();
  const { data: row, error: selectError } = await admin
    .from("email_subscribers")
    .select("id, unsubscribed_at")
    .eq("unsubscribe_token", token.trim())
    .maybeSingle();

  if (selectError || !row) {
    return htmlPage(
      "<p style='margin:0;'>This unsubscribe link is invalid or already used.</p>"
    );
  }

  if (row.unsubscribed_at !== null) {
    return htmlPage(
      "<p style='margin:0;'>This unsubscribe link is invalid or already used.</p>"
    );
  }

  const { error: updateError } = await admin
    .from("email_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", row.id);

  if (updateError) {
    return htmlPage(
      "<p style='margin:0;'>This unsubscribe link is invalid or already used.</p>"
    );
  }

  return htmlPage(
    "<p style='margin:0 0 16px;'>You've been unsubscribed.</p><p style='margin:0;'><a href='" +
      SITE_URL +
      "' style='color:#888;text-decoration:underline;'>Back to noisebrief.com</a></p>"
  );
}
