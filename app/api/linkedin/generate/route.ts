import { NextRequest, NextResponse } from "next/server";
import { generateLinkedInPost } from "@/lib/claude";
import type { Tone } from "@/types";

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

    let post = await generateLinkedInPost(summary, tone);
    if (post.length > POST_MAX_CHARS) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[linkedin/generate] Post exceeded ${POST_MAX_CHARS} chars (${post.length}), truncating.`);
      }
      post = truncatePostWithHashtags(post, POST_MAX_CHARS);
    }
    return NextResponse.json({ post });
  } catch (err) {
    console.error("LinkedIn generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }
}
