import { NextResponse } from "next/server";

/**
 * @deprecated Use /api/ai/generate-v2 instead.
 * This endpoint has been replaced by the two-phase SSE generation pipeline.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Please use /api/ai/generate-v2 instead.",
      migration: "/api/ai/generate-v2",
    },
    { status: 410 }
  );
}
