import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runDigest } from "@/lib/runDigest";

export const maxDuration = 60;

/** Manual trigger or legacy cron entry: runs digest only. Daily pipeline uses daily cron (brief then digest). */
export async function GET(request: Request) {
  const cronSecret = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const a = Buffer.from(cronSecret);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDigest();
    if (!result.ok) {
      return NextResponse.json({ message: result.reason });
    }
    return NextResponse.json({ sent: result.sent, failed: result.failed });
  } catch (err) {
    console.error("Digest cron error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
