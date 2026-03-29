import { NextRequest, NextResponse } from "next/server";
import { streamText } from "@/lib/ai/provider";
import { getCourseGeneratorPrompt, type CourseGeneratorParams } from "@/lib/prompts/course-generator";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 5 course generations per hour
  const rl = await checkRateLimit(user.id, { limit: 5, windowSec: 3600, prefix: "generate" });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. You can generate up to 5 courses per hour." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const body = (await req.json()) as CourseGeneratorParams;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamText(
          getCourseGeneratorPrompt(body),
          "You are an expert curriculum designer. Return only valid JSON — no markdown, no extra text.",
          (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n\n__ERROR__:${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
