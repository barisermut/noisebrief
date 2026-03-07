import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateLinkedInPost } from "@/lib/claude";
import type { Database } from "@/types/supabase";
import type { Tone } from "@/types";

type DailyBriefRow = Database["public"]["Tables"]["daily_briefs"]["Row"];

const TONES: Tone[] = [
  "Quirky",
  "Formal",
  "Cheesy",
  "Savage",
  "Inspirational",
  "TLDR",
];
const SUMMARY_MAX_LENGTH = 50000;
const POST_MAX_CHARS = 700;

/** Truncate at last complete sentence before maxLen; append hashtag line if present. */
function truncatePostWithHashtags(post: string, maxLen: number): string {
  const lines = post.split("\n");
  const lastLine = lines[lines.length - 1]?.trim() ?? "";
  const hasHashtags = lastLine.includes("#") && (lastLine.match(/#\w+/g)?.length ?? 0) >= 1;
  const hashtagLine = hasHashtags ? lastLine : "";
  let body = hasHashtags ? lines.slice(0, -1).join("\n").trim() : post;
  const suffix = hashtagLine ? `\n${hashtagLine}` : "";
  const allowedBodyLen = maxLen - suffix.length;
  if (body.length <= allowedBodyLen) return post;
  const slice = body.slice(0, allowedBodyLen);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  );
  const cut = lastSentenceEnd >= 0 ? lastSentenceEnd + 1 : allowedBodyLen;
  body = body.slice(0, cut).trim();
  return body + suffix;
}

/** Type for generated_posts jsonb: tone -> post text */
type GeneratedPostsMap = Record<string, string>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tone, summary } = body as { tone?: string; summary?: string };

    if (!tone || typeof summary !== "string") {
      return NextResponse.json(
        { error: "Missing tone or summary" },
        { status: 400 }
      );
    }

    if (!TONES.includes(tone as Tone)) {
      return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
    }

    if (summary.length > SUMMARY_MAX_LENGTH) {
      return NextResponse.json(
        { error: "Summary too long" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    // All reads and writes use service role client; anon client cannot write rows.
    const supabaseAdmin = getSupabaseAdmin();

    console.log("Checking Supabase cache for tone:", tone);
    const { data } = await supabaseAdmin
      .from("daily_briefs")
      .select("generated_posts, date")
      .eq("date", today)
      .maybeSingle();

    if (process.env.NODE_ENV === "development") {
      console.log("Supabase select result:", data);
      if (data?.date != null) console.log("Stored date format:", data.date, "query date:", today);
    }

    const row = data as (Pick<DailyBriefRow, "generated_posts"> & { date?: string }) | null;
    const cached = (row?.generated_posts as GeneratedPostsMap | null) ?? {};
    if (cached[tone]) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[post/generate] Cache hit for tone "${tone}", skipping Claude`);
      }
      return NextResponse.json({ post: cached[tone] });
    }

    console.log("Cache miss - generating with Claude");
    let generatedPost = await generateLinkedInPost(summary, tone);
    if (generatedPost.length > POST_MAX_CHARS) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[post/generate] Post exceeded ${POST_MAX_CHARS} chars (${generatedPost.length}), truncating.`);
      }
      generatedPost = truncatePostWithHashtags(generatedPost, POST_MAX_CHARS);
    }

    console.log("Saving to Supabase...");
    const { error: rpcError } = await supabaseAdmin.rpc("set_generated_post_if_missing", {
      brief_date: today,
      tone_key: tone,
      post_text: generatedPost,
    });
    if (rpcError) {
      // ACTION REQUIRED: If function not found, run supabase/migrations/set_generated_post_if_missing.sql in Supabase SQL editor.
      console.error("Supabase RPC set_generated_post_if_missing error:", rpcError);
      return NextResponse.json(
        { error: "Failed to save generated post" },
        { status: 500 }
      );
    }
    console.log("Saved successfully");

    return NextResponse.json({ post: generatedPost });
  } catch (err) {
    console.error("Post generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }
}
