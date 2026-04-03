import { NextResponse } from "next/server";

/**
 * MAKE IT YOURS (LinkedIn-style posts by tone) — disabled.
 * Full implementation removed from this route; restore from git history if needed.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This feature is not available." },
    { status: 410 }
  );
}
